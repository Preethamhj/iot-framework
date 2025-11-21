import serial
import time

# Change COM7 to your actual COM port
ser = serial.Serial("COM7", 9600, timeout=3)

while True:
    line = ser.readline().decode(errors="ignore").strip()
    if line:
        print("Received:", line)