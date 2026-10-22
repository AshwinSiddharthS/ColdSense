/**
 * Cold-Chain Monitoring System — ESP32 + DHT22 Firmware
 * 
 * Hardware:
 *   - Microcontroller: ESP32 DevKit / ESP32-WROOM
 *   - Sensor: 4-pin DHT22 / AM2302
 *   - Pin Connections:
 *       Pin 1 (Left, VCC):    ESP32 3V3
 *       Pin 2 (DATA):         ESP32 GPIO 4 (with 4.7k - 10k pull-up resistor to 3V3 if bare sensor)
 *       Pin 3 (NC):           Not connected
 *       Pin 4 (Right, GND):   ESP32 GND
 * 
 * Dependencies (install via Arduino IDE Library Manager):
 *   - DHT sensor library by Adafruit
 *   - Adafruit Unified Sensor
 *   - ArduinoJson by Benoit Blanchon (v6 or v7)
 * 
 * Baud Rate: 115200
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ── Sensor Configuration ──────────────────────────────────────
#define DHTPIN 4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);

// ── Network Credentials ───────────────────────────────────────
// Replace with your 2.4 GHz Wi-Fi credentials
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ── Backend Configuration ─────────────────────────────────────
// Connected to your live Render backend
const char* SERVER_URL    = "https://coldsense-upk4.onrender.com/api/sensors/readings";

// Device Identifier
const char* DEVICE_ID     = "cold-chain-01";

// Device Authentication Token (matches DEVICE_AUTH_TOKEN in backend .env)
// If backend authentication is disabled in dev mode, this header will be ignored by server
const char* DEVICE_TOKEN  = "dev_device_token_123";

// Ingestion interval: 5 seconds (5000ms) for initial testing
const unsigned long INTERVAL_MS = 5000;
unsigned long lastSendTime = 0;

// Maximum consecutive Wi-Fi reconnect attempts before brief cooldown
const int MAX_RECONNECT_ATTEMPTS = 15;

// ── Helper: Connect / Reconnect Wi-Fi Non-blocking ────────────
void ensureWiFiConnected() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  Serial.println(F("[WIFI] Disconnected. Reconnecting..."));
  WiFi.disconnect();
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < MAX_RECONNECT_ATTEMPTS) {
    delay(500);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("\n[WIFI] Connected!"));
    Serial.print(F("[WIFI] IP Address: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\n[WIFI] Reconnection failed. Will retry on next cycle."));
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println(F("========================================"));
  Serial.println(F(" Cold-Chain ESP32 + DHT22 Monitor       "));
  Serial.println(F("========================================"));
  Serial.print(F("Device ID: "));
  Serial.println(DEVICE_ID);
  Serial.print(F("Data GPIO: GPIO "));
  Serial.println(DHTPIN);
  Serial.print(F("Target URL: "));
  Serial.println(SERVER_URL);

  // Initialize DHT sensor
  dht.begin();

  // Initial Wi-Fi connection
  ensureWiFiConnected();
}

void loop() {
  unsigned long now = millis();

  // Non-blocking timer
  if (now - lastSendTime >= INTERVAL_MS) {
    lastSendTime = now;

    // 1. Read sensor data
    float humidity = dht.readHumidity();
    float temperature = dht.readTemperature(); // Default: Celsius

    // 2. Validate sensor readings (discard NaN values)
    if (isnan(humidity) || isnan(temperature)) {
      Serial.println(F("[SENSOR] Error: Failed to read from DHT22! Check wiring/pull-up resistor."));
      return;
    }

    // DHT22 physical operational sanity check
    if (temperature < -40.0 || temperature > 80.0 || humidity < 0.0 || humidity > 100.0) {
      Serial.printf("[SENSOR] Warning: Out-of-bounds reading discarded: Temp=%.1fC Hum=%.1f%%\n", temperature, humidity);
      return;
    }

    Serial.printf("[SENSOR] Reading: Temp=%.1f °C, Hum=%.1f %%RH\n", temperature, humidity);

    // 3. Ensure Wi-Fi is connected
    ensureWiFiConnected();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println(F("[HTTP] Skipped send: Wi-Fi offline."));
      return;
    }

    // 4. Construct JSON payload using ArduinoJson
    StaticJsonDocument<256> doc;
    doc["deviceId"] = DEVICE_ID;
    doc["temperature"] = serialized(String(temperature, 1)); // Ensures finite float
    doc["humidity"] = serialized(String(humidity, 1));

    String jsonString;
    serializeJson(doc, jsonString);

    // 5. Send HTTP POST to backend
    HTTPClient http;
    WiFiClientSecure secureClient;
    if (String(SERVER_URL).startsWith("https://")) {
      secureClient.setInsecure(); // Connect cleanly to Render HTTPS
      http.begin(secureClient, SERVER_URL);
    } else {
      http.begin(SERVER_URL);
    }
    http.setTimeout(8000); // 8 second timeout for cloud latency

    http.addHeader("Content-Type", "application/json");
    if (strlen(DEVICE_TOKEN) > 0) {
      http.addHeader("X-Device-Token", DEVICE_TOKEN);
    }

    Serial.print(F("[HTTP] Sending POST... Payload: "));
    Serial.println(jsonString);

    int httpCode = http.POST(jsonString);

    // 6. Handle HTTP response
    if (httpCode > 0) {
      if (httpCode == HTTP_CODE_CREATED) { // HTTP 201 Created
        Serial.printf("[HTTP] Success (HTTP %d). Server accepted reading.\n", httpCode);
        String response = http.getString();
        Serial.printf("[HTTP] Response: %s\n", response.c_str());
      } else {
        Serial.printf("[HTTP] Server returned error status: %d\n", httpCode);
        String response = http.getString();
        Serial.printf("[HTTP] Response body: %s\n", response.c_str());
      }
    } else {
      Serial.printf("[HTTP] Request failed, error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
  }
}
