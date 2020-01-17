#include <Wire.h>
#include "Adafruit_MotorShield.h"
#include "SparkFun_VL53L1X_Arduino_Library.h"

#define MAGICNUMBER 72019
#define SHORT_RANGE 0
#define MID_RANGE   1
#define LONG_RANGE  2

// Create the motor shield object with the default I2C address
Adafruit_MotorShield AFMS = Adafruit_MotorShield();
// Connect a stepper motor with 200 steps per revolution (1.8 degree)
// to motor port #2 (M3 and M4)
Adafruit_StepperMotor *myMotor = AFMS.getStepper(200, 2);

// Create the LIDAR sensor object
VL53L1X distanceSensor;

const int numReadings = 10;
int pointCounter =0;
String readstr;
bool reading = true;
bool powerup = true;

void setup(void) {
  Serial.begin(9600); // set up Serial library at 9600 bps
  AFMS.begin(); // create with the default frequency 1.6KHz
  myMotor->setSpeed(1); // 0.5 rpm
  Wire.begin(); // start I2C
  
  if (distanceSensor.begin() == false)
  {
    Serial.println(MAGICNUMBER-1);
  } else {
    Serial.println(MAGICNUMBER);
  }

  //Call setDistanceMode with 0, 1, or 2 to change the sensing range.
  distanceSensor.setDistanceMode(SHORT_RANGE);
}

void loop(void) {
  int distance, degree, turnNo;
  readstr = "";
  
  // Wait for a start signal
  while (readstr.compareTo("")==0) {
    readstr = Serial.readStringUntil('\n');
  }

  reading = true;
  pointCounter = 0;
  degree = 0;
  turnNo = 0;
  
  // Start
  while(reading==true) {

    // Read
    if (pointCounter<410) {
      pointCounter = pointCounter+1;
      //Poll for completion of measurement. Takes 40-50ms.
      while (distanceSensor.newDataReady() == false)
      delay(5);

      distance = distanceSensor.getDistance();

      Serial.print(turnNo); Serial.print(", ");
      Serial.print(degree); Serial.print(", ");
      Serial.print(distance);
      Serial.println();

      if (pointCounter>10) {
        if (pointCounter<=210) {
          turnNo = 0; //clockwise
          degree+=18;
          myMotor->step(1, FORWARD, SINGLE); // 1 motor step clockwise
        }
        if (pointCounter>210) {
          turnNo = 1; //counter-clockwise
          degree-=18;
          myMotor->step(1, BACKWARD, SINGLE); // 1 motor step counter-clockwise
        }
    }
      
      delay(95); // delay in between reads for stability
    } else {
      reading = false;
    }
  }
}
