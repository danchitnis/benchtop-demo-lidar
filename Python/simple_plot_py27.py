import Tkinter as tk
import ttk
import tkMessageBox as messagebox
import tkSimpleDialog as simpledialog

import matplotlib
matplotlib.use("TkAgg")
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2Tk
from matplotlib.figure import Figure
from matplotlib import style
style.use('ggplot')

import serial
import time
import threading

port = 'COM14'

f = Figure(figsize=(5,5), dpi=100)
a = f.add_subplot(111, projection='polar')

Npi = 3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679
distanceCap = 500

class TestPlotApp(tk.Tk):

    def __init__(self, *args, **kwargs):
        tk.Tk.__init__(self, *args, **kwargs)
        
        fr1 = tk.Frame(self)
        fr2 = tk.Frame(self)
        fr1.grid(row=0,column=0)
        fr2.grid(row=0,column=1)
        
        label = ttk.Label(fr1, text="Data plot")
        label.grid(row=0, pady=10,padx=10)
        
        self.canvas = FigureCanvasTkAgg(f, master=fr1)
        self.canvas.draw()
        self.canvas.get_tk_widget().grid(row=1,column=0)
        
        self.openButton = ttk.Button(fr2, text='Open connection', command=self.open_connection)
        self.openButton.grid(row=2, column=1, pady=5)
        self.closeButton = ttk.Button(fr2, text='Close connection', command=self.close_connection, state='disabled')
        self.closeButton.grid(row=3, column=1, pady=5)
        self.dataButton = ttk.Button(fr2, text="Get data", command=self.update_data, state='disabled')
        self.dataButton.grid(row=3, column=0, pady=5)

        toolbar = NavigationToolbar2Tk(self.canvas, fr1)
        toolbar.update()
        toolbar.grid(row=2, sticky=tk.W)

        
    def update_data(self):
        def callback():
            global serialConnection, distanceCap
            self.closeButton['state'] = 'disabled'
            self.dataButton['state'] = 'disabled'
            
            print serialConnection
            # Start
            serialConnection.write("a\n")
            serialConnection.flush()
            # Live plot
            print('start')
            a.clear()
            for ii in range(1,411):
                #print ii
                Distance = serialConnection.readline()#).split('\n')[0]
                #print Distance
                if ii>10:
                    Distance = int(Distance)
                    if ii>10 and ii<211 and Distance<distanceCap:
                        theta = 0+(ii-11)*2*Npi/200;
                        rho = Distance;
                    elif ii>210 and ii<411 and Distance<distanceCap:
                        theta = 2*Npi-(ii-11)*2*Npi/200;
                        rho = Distance;

                    if ii>10 and ii<211 and Distance<distanceCap:
                        a.plot(theta,rho,'.-r')
                    elif ii>210 and ii<411 and Distance<distanceCap:
                        a.plot(theta,rho,'.b')
            
                    self.canvas.draw()
                    
            self.closeButton['state'] = 'normal'
            self.dataButton['state'] = 'normal'
            
        t = threading.Thread(target=callback)
        t.start()
        
    
    def open_connection(self):
        global serialConnection
        portName = simpledialog.askstring('Open connection', 'Please, enter the USB port name:')
        try:
            serialConnection = serial.Serial(port=portName, timeout=300)
            serialConnection.baudrate = 9600
            time.sleep(1)
            serialConnection.write("a\n")
            magicnumber = int(serialConnection.readline())
            if magicnumber==72018:
                messagebox.showerror('Open connection',\
                'The sensor for board in port {} is not responding. Please check the wiring. {}'.format(portName, magicnumber))
                #serialConnection.close()
                self.closeButton['state'] = 'normal'
                self.openButton['state'] = 'disabled'
                self.dataButton['state'] = 'normal'
            elif magicnumber!=72019 and magicnumber!=(72019-1):
                messagebox.showerror('Open connection',\
                'The board in port {} does not appear to contain the time of flight demonstration program. {}'.format(portName, magicnumber))
                serialConnection.close()
            else:
                self.closeButton['state'] = 'normal'
                self.openButton['state'] = 'disabled'
                self.dataButton['state'] = 'normal'
        except:
            messagebox.showerror('Open connection', 'The connection could not be opened\nPlease, check that the port name belongs to the correct test board')
    
    def close_connection(self):
        global serialConnection
        try:
            serialConnection.close()
            self.closeButton['state'] = 'disabled'
            self.openButton['state'] = 'normal'
            self.dataButton['state'] = 'disabled'
        except:
            messagebox.showerror('Close connection', "The connection could not be closed.\nThis can be due do it not beign already open.")

serialConnection = []#serial.Serial(port=port, timeout=300)
#ser_connection.baudrate = 9600#115200#9600#57600

app = TestPlotApp()
app.mainloop()
try:
    serialConnection.close()
except:
    pass