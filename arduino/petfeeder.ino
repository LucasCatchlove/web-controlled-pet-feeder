#include <Arduino.h>
#if defined(ESP32)
#include <WiFi.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#endif


//*************************firebase
#include <Firebase_ESP_Client.h>
//Provide the token generation process info.
#include "addons/TokenHelper.h"
//Provide the RTDB payload printing info and other helper functions.
#include "addons/RTDBHelper.h"

// Insert your network credentials
#define WIFI_SSID "CHEZ_LUC"
#define WIFI_PASSWORD "19216811"
// #define WIFI_SSID "Lucas"
// #define WIFI_PASSWORD "12345678"

// Insert Firebase project API Key
#define API_KEY "AIzaSyBC1jxmcPnRllB9z6iuGsl6M417SgW0uCM"

// Insert RTDB URLefine the RTDB URL */
#define DATABASE_URL "https://petfeeder-17c6c-default-rtdb.firebaseio.com"

//Define Firebase Data object
FirebaseData fbdo;

FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;
int count = 0;
bool signupOK = false;

//*************************servo
#include <ESP32Servo.h>
Servo myservo;
// Recommended PWM GPIO pins on the ESP32 include 2,4,12-19,21-23,25-27,32-33
int servoPin = 19;

//************************load cell

#include <HX711_ADC.h>
#if defined(ESP8266) || defined(ESP32) || defined(AVR)
#include <EEPROM.h>
#endif

const int HX711_dout = 13;  //mcu > HX711 dout pin
const int HX711_sck = 12;   //mcu > HX711 sck pin

HX711_ADC LoadCell(HX711_dout, HX711_sck);
const int calVal_eepromAdress = 0;
unsigned long t = 0;
boolean newDataReady = false;
const int serialPrintInterval = 10;

//*************************range finder
const int trigPin = 33;
const int echoPin = 32;
long duration;
int distance;

//*************************piezo buzzer
const int BUZZER_PIN = 14;


//*************************feeder state variables 
int feedVal = 0; 
float bowlWeight = 0;
float foodContainerLevel = 0; 

void setup() {
  //******************firebase and wifi
    Serial.begin(115200);
    delay(1000);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(300);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());
  Serial.println();

  /* Assign the api key (required) */
  config.api_key = API_KEY;

  /* Assign the RTDB URL (required) */
  config.database_url = DATABASE_URL;

  /* Sign up */
  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("ok");
    signupOK = true;
  } else {
    Serial.printf("%s\n", config.signer.signupError.message.c_str());
  }

  /* Assign the callback function for the long running token generation task */
  config.token_status_callback = tokenStatusCallback;  //see addons/TokenHelper.h

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  if (Firebase.ready() && signupOK) {
    Firebase.RTDB.setBool(&fbdo, "feeder_state/connected", true);
  }


  //****************load cell
  LoadCell.begin();
  //LoadCell.setReverseOutput(); //uncomment to turn a negative output value to positive
  float calibrationValue;     // calibration value (see example file "Calibration.ino")
  calibrationValue = 100.93;  // uncomment this if you want to set the calibration value in the sketch
#if defined(ESP8266) || defined(ESP32)
  //EEPROM.begin(512); // uncomment this if you use ESP8266/ESP32 and want to fetch the calibration value from eeprom
#endif
  //EEPROM.get(calVal_eepromAdress, calibrationValue); // uncomment this if you want to fetch the calibration value from eeprom

  unsigned long stabilizingtime = 2000;  // preciscion right after power-up can be improved by adding a few seconds of stabilizing time
  boolean _tare = true;                  //set this to false if you don't want tare to be performed in the next step
  LoadCell.start(stabilizingtime, _tare);
  if (LoadCell.getTareTimeoutFlag()) {
    Serial.println("Timeout, check MCU>HX711 wiring and pin designations");
    while (1)
      ;
  } else {
    LoadCell.setCalFactor(calibrationValue);  // set calibration value (float)
    Serial.println("Startup is complete");
  }

  //****************servo
  myservo.setPeriodHertz(50);
  myservo.attach(servoPin);

  //****************range finder
  pinMode(trigPin, OUTPUT);  // Make the trigPin an OUTPUT
  pinMode(echoPin, INPUT);   // Make the echoPin an INPUT

  //****************piezo buzzer
}

void checkFeedStatus() {
  if (Firebase.ready() && signupOK && (millis() - sendDataPrevMillis > 5000 || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis();
    if (Firebase.RTDB.getInt(&fbdo, F("/feeder_state/feed"), &feedVal)) {
      //Serial.print("LOG: checkFeedStatus returned %s\n", String(feedVal).c_str());
    } else {
      //fbdo.errorReason().c_str();
    }
  }
}

void feed() {
  myservo.write(0); 
  delay(500);
  myservo.write(180);
  delay(feedVal*1000);
  myservo.write(0); 
  if (Firebase.ready() && signupOK) {
    Firebase.RTDB.setInt(&fbdo, "feeder_state/feed", 0);
    feedVal = 0; 
  }
}

void getScaleStatus() {
    if (LoadCell.update()) newDataReady = true;

  // get smoothed value from the dataset:
  if (newDataReady) {
    if (millis() > t + serialPrintInterval) {
      bowlWeight = LoadCell.getData();
      Serial.print("Load_cell output val: ");
      Serial.println(bowlWeight);
      newDataReady = 0;
      t = millis();
    }
  }

  // receive command from serial terminal, send 't' to initiate tare operation:
  if (Serial.available() > 0) {
    char inByte = Serial.read();
    if (inByte == 't') LoadCell.tareNoDelay();
  }

  // check if last tare operation is complete:
  if (LoadCell.getTareStatus() == true) {
    Serial.println("Tare complete");
  }
}

void getFoodContainerStatus() {
    // Clear the trigPin
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  // Send a pulse by setting the trigPin Higj for 10 Micro seconds
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Read the length of time for the sound wave to return
  duration = pulseIn(echoPin, HIGH);

  // Calculating the total distance from the object
  foodContainerLevel = duration * 0.034 / 2;

  // Prints the distance to the Serial Port
  Serial.print("Food container level is: ");
  Serial.println(foodContainerLevel);
}




void loop() {

  checkFeedStatus();
  if(feedVal > 0 && bowlWeight <= 50) {
    Serial.print(feedVal);
    Serial.print("dispensing food...\n");
    feed();
  }
   getScaleStatus(); 
   //getFoodContainerStatus();

}