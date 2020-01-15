#define MAGICNUMBER 72019
#define CONNECT_PIN 2
#define SPIRAL_PIN  3
#define RANDOM_PIN  4
/*  To simulate different situations connect the following pints to Ground
 *  with a jumper wire:
 *  Pin   Description
 *  D2    Simulate sensor disconnected. MAGICNUMBER-1 will be sent on startup
 *  D3    The data sent will be an increasing counter (a spiral in polar coords)
 *  D4    The data sent will be random
 *  -no-  The data sent will be a constant 5
*/

int data_mode = 0; // 0 = single value ; 1 = spiral ; 2 = random
int Counter = 0;
const int numReadings = 10;
int myCounter =0;
String readstr;
bool reading = true;
bool powerup = true;

void setup(void) {
  pinMode(CONNECT_PIN, INPUT_PULLUP);
  pinMode(SPIRAL_PIN, INPUT_PULLUP);
  pinMode(RANDOM_PIN, INPUT_PULLUP);

  if (digitalRead(SPIRAL_PIN) == LOW) {
    data_mode = 1;
  }
  else if (digitalRead(RANDOM_PIN) == LOW) {
    data_mode = 2;
  }
  else {
    data_mode = 0;
  }
  
  randomSeed(analogRead(A0)); // init for random data
  Serial.begin(9600);

  if (digitalRead(CONNECT_PIN) == LOW)
  {
    Serial.println(MAGICNUMBER-1);
  } else {
    Serial.println(MAGICNUMBER);
  }

}

void loop(void) {
  int distance;
  readstr = "";
  while (readstr.compareTo("")==0) {
    readstr = Serial.readStringUntil('\n');
  }

    reading = true;
    myCounter = 0;
    Counter = 0;
    
    while(reading==true) {
      if (myCounter>9) {
        if (Counter<=200) {
          Counter = Counter+1;
          delay(10); // 1 motor step
        }
        if (Counter>200 && Counter<=400) {
          Counter = Counter+1;
          delay(10); // 1 motor step
        }
      }
      
      if (myCounter<410) {
        myCounter = myCounter+1;
        //Poll for completion of measurement. Takes 40-50ms.
        delay(40);
        delay(5);

        switch (data_mode) {
          case 0 : distance = 5;
                   break;
          case 1 : distance = myCounter;
                   break;
          case 2 : distance = random(100);
                   break;
          default : distance = 0;
        }

        Serial.print(distance);
        Serial.println();
        delay(100); // delay in between reads for stability
      } else {
        reading = false;
      }
    }
}
