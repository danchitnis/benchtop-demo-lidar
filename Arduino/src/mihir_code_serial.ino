#include <Wire.h>
#include <Adafruit_MotorShield.h>
#define MAGICNUMBER 72019
// Create the motor shield object with the default I2C address
Adafruit_MotorShield AFMS = Adafruit_MotorShield();
// Or, create it with a different I2C address (say for stacking)
// Adafruit_MotorShield AFMS = Adafruit_MotorShield(0x61);
// Connect a stepper motor with 200 steps per revolution (1.8 degree)
// to motor port #2 (M3 and M4)
Adafruit_StepperMotor *myMotor = AFMS.getStepper(200, 2);
int Counter = 0;

#include "SparkFun_VL53L1X_Arduino_Library.h"

VL53L1X distanceSensor;
uint8_t shortRange = 0;
uint8_t midRange = 1;
uint8_t longRange = 2;
const int numReadings = 10;
int myCounter =0;
String readstr;
bool reading = true;
bool powerup = true;

void setup(void) {
  Serial.begin(9600); // set up Serial library at 9600 bps
  //Serial.println("Stepper test!");
  AFMS.begin(); // create with the default frequency 1.6KHz
  //AFMS.begin(1000); // OR with a different frequency, say 1KHz
  myMotor->setSpeed(1); // 0.5 rpm
  Wire.begin();
  Serial.begin(9600);
  //Serial.println("VL53L1X Qwiic Test");
  if (distanceSensor.begin() == false)
  {
    Serial.println(MAGICNUMBER-1);
  } else {
    Serial.println(MAGICNUMBER);
  }
  //Call setDistanceMode with 0, 1, or 2 to change the sensing range.
  distanceSensor.setDistanceMode(shortRange);
}

void loop(void) {
  readstr = "";
  while (readstr.compareTo("")==0) {
    readstr = Serial.readStringUntil('\n');
  }
//  if (powerup=true) {
//    Serial.println(MAGICNUMBER);
//    powerup=false;
//  }
//  else {
    reading = true;
    myCounter = 0;
    Counter = 0;
    
    while(reading==true) {
      if (myCounter>9) {
        if (Counter<=200) {
          Counter = Counter+1;
          //Serial.println("Single coil steps");
          myMotor->step(1, FORWARD, SINGLE);
        }
        if (Counter>200 && Counter<=400) {
          Counter = Counter+1;
          //Serial.println("Single coil steps");
          myMotor->step(1, BACKWARD, SINGLE);
        }
      }
      
      if (myCounter<410) {
        myCounter = myCounter+1;
        //Poll for completion of measurement. Takes 40-50ms.
        while (distanceSensor.newDataReady() == false)
        delay(5);
        int distance = distanceSensor.getDistance(); //Get the result of the measurement from the sensor
        //Serial.print("Distance(mm): ");
        Serial.print(distance);
        Serial.println();
        delay(100); // delay in between reads for stability
      } else {
        reading = false;
      }
    }
//  }
}
