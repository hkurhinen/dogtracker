#!/bin/bash

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"
sleep 30
echo "4" > /sys/class/gpio/export
sleep 0.1
echo "out" > /sys/class/gpio/gpio4/direction
echo "0" > /sys/class/gpio/gpio4/value
echo "6" > /sys/class/gpio/export
sleep 0.1
echo "out" > /sys/class/gpio/gpio6/direction
echo "0" > /sys/class/gpio/gpio6/value
sleep 10
stty -F /dev/ttyS0 115200
sleep 1
echo -e "AT+CGPSINFO=3\r\n" > /dev/ttyS0
node ../dist/tracker/index.js