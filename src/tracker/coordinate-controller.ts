import SerialPort from "serialport";
import Readline from "@serialport/parser-readline";
import { EventEmitter } from "events";
import { Point } from "../common/types";

/**
 * Class for handling serial communications to get coordinates
 */
export default class CoordinateController extends EventEmitter {

  private port: SerialPort;
  private parser: any;

  constructor(device: string) {
    super();
    this.port = new SerialPort(device, {
      baudRate: 115200
    });

    this.parser = this.port.pipe(new Readline());
    this.parser.on("data", this.onData);
  }

  /**
   * Handles data received thru serial
   */
  private onData = (data: string) => {
    if (!data.startsWith("+CGPSINFO:")) {
      return;
    }

    data = data.replace("+CGPSINFO:", "");
    data = data.trim();
    if (data.startsWith(",")) {
      return;
    }

    const dataParts = data.split(",");
    if (dataParts.length !== 9) {
      return;
    }

    const coordinates: Point = {
      lat: this.parseCoord(dataParts[0], dataParts[1]),
      lon: this.parseCoord(dataParts[2], dataParts[3])
    };

    console.log(data);
    this.emit("coordinates", coordinates);
  }

  /**
   * Parses coordinates from gps nmea format
   * 
   * @param coord coordinate in gps nmea format
   * @param dir nort,east,south or west
   */
  private parseCoord(coord: string, dir: string) {
    if (coord === '') {
      return null;
    }

    let n: number, sgn: number = 1;
    switch (dir) {
      case "S":
        sgn = -1;
      case "N":
        n = 2;
      break;

      case "W":
        sgn = -1;
      case "E":
        n = 3;
      break;
    }

    return sgn * (parseFloat(coord.slice(0, n)) + parseFloat(coord.slice(n)) / 60);
  }
}