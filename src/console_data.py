import serial
import time

Npi = 3.14159265358979323846264338327950288419716939937510582097494459230781641
distanceCap = 500
portName = 'COM7'

connectionOK = False

######## To simplify the search of connection errors for a student / school who
######## is not familiar with parts of the hardware, the Arduino program is
######## able to check if the board connected has the correct sketch programmed
######## and if the sensor is connected. After sending "a", a "magic number" is
######## returned.
######## To skip this step, comment block (1), and uncomment block (2)

######## (1). Read the magic number
try:
    serialConnection = serial.Serial(port=portName, timeout=300)
    serialConnection.baudrate = 9600
    time.sleep(1) # Sleep 1 second to let the Arduino restart
    serialConnection.write("a\n")
    magicnumber = int(serialConnection.readline())
    if magicnumber==72018:
        print('The sensor for board in port {} is not responding. Please check \
               the wiring. {}'.format(portName, magicnumber))
        serialConnection.close()
        
    elif magicnumber!=72019 and magicnumber!=(72019-1):
        print('The board in port {} does not appear to contain the time of\
               flight demonstration program. {}'.format(portName, magicnumber))
        serialConnection.close()
    else:
        connectionOK = True

except:
    print('The connection could not be opened')
    print('Please, check that the port name belongs to the correct test board')
    connectionOK = False
########

######## (2). Alternative code: don't read the magic number
# try:
    # serialConnection = serial.Serial(port=portName, timeout=300)
    # serialConnection.baudrate = 9600
    # time.sleep(1)
    # connectionOK = True
# except:
    # print('The connection could not be opened')
    # print('Please, check that the port name belongs to the correct test board')
    # connectionOK = False
########

if connectionOK == True:
    # Start
    serialConnection.write("a\n")
    serialConnection.flush()
    # Live plot
    for ii in range(1,411):
        Distance = serialConnection.readline()
        
        if ii>10: # Ignore the first 10 measurements (they are unreliable)
            Distance = int(Distance)
            
            # Calculate angle and radius to plot. Cut distances greater than the
            # desired cap
            if ii>10 and ii<211 and Distance<distanceCap:
                theta = 0+(ii-11)*2*Npi/200;
                rho = Distance;
            elif ii>210 and ii<411 and Distance<distanceCap:
                theta = 2*Npi-(ii-11)*2*Npi/200;
                rho = Distance;

            # Plot the data from the forwards sweep and the backwards sweep
            # separately
            if ii>10 and ii<211 and Distance<distanceCap:
                print('1. {} {}'.format(theta,rho))
            elif ii>210 and ii<411 and Distance<distanceCap:
                print('2. {} {}'.format(theta,rho))

    serialConnection.close()