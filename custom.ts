/**
 * Custom blocks
 */
/**
 * https://github.com/myDevicesIoT/cayenne-docs/blob/master/docs/LORA.md
 */
const enum LPP_DATA_TYPE {
    //% block="Digital Input"
    Digital_Input = 0,
    //% block="Digital Output"
    Digital_Output = 1,
    //% block="Analog Input"
    Analog_Input = 2,
    //% block="Analog Output"
    Analog_Output = 3,
    //% block="Temperature"
    Temperature = 0x67,
    //% block="Humidity"
    Humidity = 0x68,
    //% block="Pressure"
    Pressure = 0x73
};

const enum LPP_Bit_Sensor {
    //% block="Temparature Sensor"
    Temperature = 21,
    //% block="Light Level"
    Light,
    //% block="LED Brightness"
    LED_Brightness,
};

const enum LPP_Direction {
    //% block="Input"
    Input_Port = 0,
    //% block="Output"
    Output_Port = 1,
};

//% color=#75b233 icon="\uf085" weight=96
namespace cayenneLPP {

    const LPP_Pin_Chan: number[] = [-1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19, 20]

    //%
    function getchan(id: number): number {
        switch (id) {
            case LPP_Bit_Sensor.Temperature: return LPP_Bit_Sensor.Temperature
            case LPP_Bit_Sensor.Light: return LPP_Bit_Sensor.Light
            case LPP_Bit_Sensor.LED_Brightness: return LPP_Bit_Sensor.LED_Brightness
            default:
                return LPP_Pin_Chan[id]
        }
    }

    //%
    function getid(ch: number): number {
        switch (ch) {
            case LPP_Bit_Sensor.Temperature: return LPP_Bit_Sensor.Temperature
            case LPP_Bit_Sensor.Light: return LPP_Bit_Sensor.Light
            case LPP_Bit_Sensor.LED_Brightness: return LPP_Bit_Sensor.LED_Brightness
            default:
                return LPP_Pin_Chan.indexOf(ch)
        }
    }

    class cayenneLPP {
        id: number
        channel: number
        ctype: number
        value: number

        constructor(id: number, ctype: LPP_DATA_TYPE) {
            this.id = id
            this.channel = getchan(id)
            this.ctype = ctype

            switch (id) {
                case LPP_Bit_Sensor.LED_Brightness:
                    this.value = led.brightness()
                    break
                default:
                    this.value = 0
            }
        }
    }

    const LPP_PIN_MAX = 5
    let LPP_Temparature: cayenneLPP = null
    let LPP_Light: cayenneLPP = null
    let LPP_Brightness: cayenneLPP = null
    let LPP_Pin_0: cayenneLPP = null
    let LPP_Pin: cayenneLPP[] = []

    //%
    function byteToHexString(value: number): string {
        let v: number = value % 256
        return (("0123456789ABCDEF"[v >> 4]) + ("0123456789ABCDEF"[v & 0xF]))
    }

    //%
    function intToHexString(value: number): string {
        let v: number = value % 65536
        return (byteToHexString(v >> 8) + byteToHexString(v & 0xFF))
    }

    function HexStringToByte(text: string): number {
        let n = 0
        let h = 0

        if (text.length > 0) {
            h = text.charCodeAt(0)

            if ((h >= 48) && (h <= 57))         //'0' - '9'
                n = h - 48
            else if ((h >= 65) && (h <= 70))    //'A' - 'F'
                n = h - 55
            else if ((h >= 97) && (h <= 102))   //'a' - 'f'
                n = h - 87
            else
                n = 0
        }

        if (text.length > 1) {
            h = text.charCodeAt(1)

            if ((h >= 48) && (h <= 57))         //'0' - '9'
                n = (n * 16) + (h - 48)
            else if ((h >= 65) && (h <= 70))    //'A' - 'F'
                n = (n * 16) + (h - 55)
            else if ((h >= 97) && (h <= 102))   //'a' - 'f'
                n = (n * 16) + (h - 87)
            else
                n = n * 16
        }

        return n
    }

    /**
    * Convert Raw Data to Cayenne Low-Powered Payload (Hexstring) https://github.com/myDevicesIoT/cayenne-docs/blob/master/docs/LORA.md
    * @param llpType Cayenne LPP Type
    * @param channel LPP Channel from 1-255
    * @param value Number
    */
    //% weight=90
    //% blockId="cayenneLPP_lpp"
    //% block="Convert to CayenneLPP|Type %llpType|at Channel %channel|with Raw Data %value"
    //% channel.defl=1
    //% channel.min=1 channel.max=255
    export function lpp(llpType: LPP_DATA_TYPE, channel: number, value: number, ratio = 1): string {
        let header = byteToHexString(channel) + byteToHexString(llpType)
        switch (llpType) {
            case LPP_DATA_TYPE.Digital_Input: return (header + (value <= 0 ? "00" : "01"))
            case LPP_DATA_TYPE.Digital_Output: return (header + (value <= 0 ? "00" : "01"))
            case LPP_DATA_TYPE.Analog_Input: return (header + intToHexString(Math.round(value * 100)))
            case LPP_DATA_TYPE.Analog_Output: return (header + intToHexString(Math.round(value * 100)))
            case LPP_DATA_TYPE.Temperature: return (header + intToHexString(Math.round(value * 10)))
            case LPP_DATA_TYPE.Humidity: return (header + byteToHexString(Math.round(value * 2)))
            case LPP_DATA_TYPE.Pressure: return (header + intToHexString(Math.round(value * 10)))
            default: return ""
        }
    }

    /**
    * Register Sensor 
    * @param sensor Sensortype
    */
    //% weight=99
    //% blockId="cayenneLPP_register_sensor"
    //% block="Register %sensor"
    //% pin.defl=LPP_Bit_Sensor.Temperature
    export function register_sensor(sensor: LPP_Bit_Sensor) {
        switch (sensor) {
            case LPP_Bit_Sensor.Temperature:
                LPP_Temparature = new cayenneLPP(sensor, LPP_DATA_TYPE.Temperature)
                if (LPP_Pin.length > LPP_PIN_MAX) LPP_Pin.shift()
                LPP_Pin.push(LPP_Temparature)
                break

            case LPP_Bit_Sensor.Light:
                LPP_Light = new cayenneLPP(sensor, LPP_DATA_TYPE.Analog_Input)
                if (LPP_Pin.length > LPP_PIN_MAX) LPP_Pin.shift()
                LPP_Pin.push(LPP_Light)
                break

            case LPP_Bit_Sensor.LED_Brightness:
                LPP_Light = new cayenneLPP(sensor, LPP_DATA_TYPE.Analog_Output)
                if (LPP_Pin.length > LPP_PIN_MAX) LPP_Pin.shift()
                LPP_Pin.push(LPP_Light)
                break
        }
    }

    /**
        * Register Digital Pin to CayenneLLP
        * @param pin DigitalPin
    */
    //% weight=100
    //% blockId="cayenneLPP_register_digital"
    //% block="Register Digital %dir|Pin %pin"
    //% pin.defl=DigitalPin.P0
    export function register_digital(dir: LPP_Direction, pin: DigitalPin) {
        if (dir == LPP_Direction.Input_Port)
            LPP_Pin_0 = new cayenneLPP(pin, LPP_DATA_TYPE.Digital_Input)
        else
            LPP_Pin_0 = new cayenneLPP(pin, LPP_DATA_TYPE.Digital_Output)

        if (LPP_Pin.length > LPP_PIN_MAX) LPP_Pin.shift()
        LPP_Pin.push(LPP_Pin_0)
    }

    /**
        * Register Analog Pin to CayenneLLP
        * @param pin AnologPin
    */
    //% weight=100
    //% blockId="cayenneLPP_register_analog"
    //% block="Register Analog %dir|Pin %pin"
    //% pin.defl=AnalogPin.P0
    export function register_analog(dir: LPP_Direction, pin: AnalogPin) {
        if (dir == LPP_Direction.Input_Port)
            LPP_Pin_0 = new cayenneLPP(pin, LPP_DATA_TYPE.Analog_Input)
        else
            LPP_Pin_0 = new cayenneLPP(pin, LPP_DATA_TYPE.Analog_Output)

        if (LPP_Pin.length > LPP_PIN_MAX) LPP_Pin.shift()
        LPP_Pin.push(LPP_Pin_0)
    }

    /**
    * Read & Pack I/O to CayenneLPP
    * @param no
    */
    //% weight=98
    //% blockId="cayenneLPP_lpp_upload"
    //% block="CayenneLPP"
    export function lpp_upload(): string {
        let payload = ""
        for (let c = 0; c < LPP_Pin.length; c++) {
            switch (LPP_Pin[c].id) {
                case LPP_Bit_Sensor.Temperature:
                    LPP_Pin[c].value = input.temperature()  // celsius
                    break
                case LPP_Bit_Sensor.Light:
                    LPP_Pin[c].value = input.lightLevel()   // 0 - 255
                    break
                case LPP_Bit_Sensor.LED_Brightness:
                    LPP_Pin[c].value = led.brightness()     // 0 - 255
                    break
                default:
                    switch (LPP_Pin[c].ctype) {
                        case LPP_DATA_TYPE.Digital_Input:
                            LPP_Pin[c].value = pins.digitalReadPin(LPP_Pin[c].id)
                            break
                        case LPP_DATA_TYPE.Digital_Output:
                            break
                        case LPP_DATA_TYPE.Analog_Input:
                            LPP_Pin[c].value = pins.analogReadPin(LPP_Pin[c].id)    // 0 - 1023
                            break
                        case LPP_DATA_TYPE.Analog_Output:
                            break
                        default:
                            break
                    }
            }
            payload = payload + lpp(LPP_Pin[c].ctype, LPP_Pin[c].channel, LPP_Pin[c].value)
        }
        return payload
    }

    /**
    * Update I/O with CayenneLPP
    * @param no
    */
    //% weight=97
    //% blockId="cayenneLPP_lpp_update"
    //% block="Update I/O with | %payload"
    export function lpp_update(payload: string) {
        if (LPP_Pin.length > 0) {
            let i = 0
            while ((i * 2) < payload.length) {
                let ch = HexStringToByte(payload.substr(i++ * 2, 2))

                let l = 0
                while ((LPP_Pin[l].channel != ch) && (l < LPP_Pin.length)) {
                    l++
                }

                if (LPP_Pin[l].channel != ch)
                    i = i + 3
                else {
                    let v = HexStringToByte(payload.substr((i++) * 2, 2))
                    v = (v * 256) + HexStringToByte(payload.substr((i++) * 2, 2))
                    i++

                    switch (LPP_Pin[l].id) {
                        case LPP_Bit_Sensor.Temperature:
                            break
                        case LPP_Bit_Sensor.Light:
                            break
                        case LPP_Bit_Sensor.LED_Brightness:
                            LPP_Pin[l].value = pins.map(v, 0, 25500, 0, 255)
                            led.setBrightness(LPP_Pin[l].value)
                            break
                        default:
                            switch (LPP_Pin[l].ctype) {
                                case LPP_DATA_TYPE.Digital_Input:
                                    break
                                case LPP_DATA_TYPE.Digital_Output:
                                    LPP_Pin[l].value = (v == 0) ? 0 : 1
                                    pins.digitalWritePin(LPP_Pin[l].id, LPP_Pin[l].value)
                                    break
                                case LPP_DATA_TYPE.Analog_Input:
                                    break
                                case LPP_DATA_TYPE.Analog_Output:
                                    LPP_Pin[l].value = v
                                    pins.analogWritePin(LPP_Pin[l].id, LPP_Pin[l].value)
                                    break
                                default:
                                    break
                            }
                    }
                }
            }
        }
    }

    /**
    * Read and convert Digital Input Pin to CayenneLLP
    * @param pin DigitalPin
    */
    //% weight=99
    //% blockId="cayenneLPP_digital_input"
    //% block="Read Digital Input Pin %pin|and Convert to CayenneLPP"
    //% pin.defl=DigitalPin.P0
    function digital_input(pin: DigitalPin): string {
        return lpp(LPP_DATA_TYPE.Digital_Input, getchan(pin), pins.digitalReadPin(pin))
    }

    /**
    * Read and convert Digital Output Pin to CayenneLLP
    * @param pin DigitalPin
    */
    //% weight=98
    //% blockId="cayenneLPP_digital_output"
    //% block="Read Digital Output Pin %pin|and Convert to CayenneLPP"
    //% pin.defl=DigitalPin.P0
    function digital_output(pin: DigitalPin): string {
        return lpp(LPP_DATA_TYPE.Digital_Output, getchan(pin), pins.digitalReadPin(pin))
    }

    /**
    * Read and convert Analog Input Pin to CayenneLLP
    * @param pin AnalogPin
    */
    //% weight=97
    //% blockId="cayenneLPP_analog_input"
    //% block="Read Analog Input Pin %pin|and Convert to CayenneLPP"
    //% pin.defl=AnalogPin.P0
    function analog_input(pin: AnalogPin): string {
        return lpp(LPP_DATA_TYPE.Analog_Input, getchan(pin), pins.analogReadPin(pin))
    }

    /**
    * Read and convert AnalogPin Output to CayenneLLP
    * @param pin AnalogPin
    */
    //% weight=96
    //% blockId="cayenneLPP_analog_output"
    //% block="Read Analog Output Pin %pin|and Convert to CayenneLPP"
    //% pin.defl=AnalogPin.P0
    function analog_output(pin: AnalogPin): string {
        return lpp(LPP_DATA_TYPE.Analog_Output, getchan(pin), pins.analogReadPin(pin))
    }
}

/**************************************************************************************
 * lorabit: LoRaWAN I2C Module Interface
 */

const enum loraJoin_Mode {
    //% block=ABP
    ABP = 0,
    //% block=OTAA
    OTAA = 1
};

const enum loraBit_Confirmed {
    //% block=Uncomfirmed
    Uncomfirmed,
    //% block=Confirmed
    Confirmed
};

const enum loraBit_ADR {
    //% block=On
    On = 1,
    //% block=Off
    Off = 0
};

const enum loraJoin_State {
    RESET = 0,
    NOT_JOINED = 1,
    JOINED = 2,
    JOIN_FAIL = 3
};

const enum loraBit_Event {
    RESET = 0,
    INITED = 1,
    JOINED = 2,
    JOIN_FAIL = 4,    //JOIN_FAIL = 4,  JOIN_DENIED = 4,
    TX_COMPLETE = 8,
    ACK_NOT_RECEIVED = 16,
    TXRXPEND = 128,
}

const enum loraBit_Cmd {
    GET_STATUS = 0,
    RESET = 1,
    JOIN = 2,
    SEND = 3,
    GET = 4,

    CONFIG = 16,
    DEVEUI_REG = 17,
    APPEUI_REG = 18,
    APPKEY_REG = 19,

    DEVADDR_REG = 33,
    NWKSKEY_REG = 34,
    APPSKEY_REG = 35,
    NETID_REG = 36
}

/**
 * Custom blocks uf1eb
 */
//% color=#0071bc icon="\uf012" weight=96
namespace loraBit {

    //%
    function byteToHexString(value: number): string {
        return (("0123456789ABCDEF"[value >> 4]) + ("0123456789ABCDEF"[value & 0xF]))
    }

    //%
    function HexStringToVal(text: string): Buffer {
        let boffset = text.length % 2
        let len = (text.length / 2) + boffset
        let temp = pins.createBuffer(len)

        let b = 0
        let h = 0
        let offset = 0
        let v = 0

        for (let i = 0; i < text.length; i++) {
            h = text.charCodeAt(i)

            if ((h >= 48) && (h <= 57))         //'0' - '9'
                offset = 48
            else if ((h >= 65) && (h <= 70))    //'A' - 'F'
                offset = 55
            else if ((h >= 97) && (h <= 102))   //'a' - 'f'
                offset = 87
            else
                offset = h

            if (((i + boffset) % 2) != 0) {
                temp[b] = v | (h - offset)  //temp.setNumber(NumberFormat.UInt8LE, b, v | (h - offset));
                b++;
            } else
                v = (h - offset) << 4
        }
        return temp
    }

    const I2C_ADDR: number = 0x63
    const LORA_EVENT_ID: number = 8888
    const RX_PAYLOAD_MAX_LEN: number = 16
    const TX_TIMEOUT: number = 60000    //mSec

    let joinMode: number = loraJoin_Mode.OTAA
    let ReceivedPort: number = 0
    let ReceivedPayload: string = ""

    let config = (1 * 64) + (5 % 8) * 8 + (2 % 8)    //(joinMode * 128) + 
    let APPEUI: Buffer = pins.createBuffer(8); APPEUI.fill(0);
    let DEVEUI: Buffer = pins.createBuffer(8); DEVEUI.fill(0);
    let APPKEY: Buffer = pins.createBuffer(16); APPKEY.fill(0);
    let NETID: number = 19
    let DEVADDR: Buffer = pins.createBuffer(4); DEVADDR.fill(0);
    let NWKSKEY: Buffer = pins.createBuffer(16); NWKSKEY.fill(0);
    let APPSKEY: Buffer = pins.createBuffer(16); APPSKEY.fill(0);

    let loraStatus: number = loraBit_Event.RESET
    let loraStatusPause: number = 0
    let loraStatusAck: boolean = false
    let txrxpend: boolean = false
    let rxWindows: boolean = false
    let joinState: number = loraJoin_State.JOINED
    let rejoin: boolean = false

    control.inBackground(() => {
        let cmd = pins.createBuffer(1)
        cmd[0] = loraBit_Cmd.GET_STATUS
        let tmp: Buffer = pins.createBuffer(0)
        let txto: number = 0    // TX/wait Rejoin timout
        let s = 0

        while (true) {
            do {
                do {
                    do {
                        if (loraStatusPause > 0) {
                            basic.pause(50)
                            if (txto > 0) txto -= 50
                        }
                        if (!loraStatusAck) loraStatusAck = true
                    } while (loraStatusPause > 0)

                    do {
                        basic.pause(200)
                        if (txto > 0) txto -= 200

                        pins.i2cWriteBuffer(I2C_ADDR, cmd, true)
                        tmp = pins.i2cReadBuffer(I2C_ADDR, 1, false)
                    } while ((tmp.length == 0) && (loraStatusPause == 0))
                } while (loraStatusPause > 0)
                /*
                if (tmp.length != 0)
                    if (s != tmp[0])
                        if (tmp[0] != 0) console.log(tmp[0].toString())
                */
                s = tmp[0]

            } while ((s == loraBit_Event.RESET) || ((s & loraBit_Event.TXRXPEND) != 0))

            //if (s != loraStatus) console.log(s.toString())

            if (joinState != loraJoin_State.JOINED) { // RESET) || NOT_JOINED) || JOIN_FAIL
                if ((s & loraBit_Event.JOINED) != 0) {
                    joinState = loraJoin_State.JOINED
                    txrxpend = false
                    console.log("EV_JOINED")
                }
                else
                    if (txto <= 0) {
                        if (joinState == loraJoin_State.NOT_JOINED)
                            txto = TX_TIMEOUT * 5
                        else
                            txto = TX_TIMEOUT * 10
                        txrxpend = false
                        console.log(">REJOIN")
                    }
            }
            else {
                if ((s & loraBit_Event.JOINED) == 0) {
                    if ((s & loraBit_Event.JOIN_FAIL) == 0) {
                        joinState = loraJoin_State.NOT_JOINED
                        txto = TX_TIMEOUT * 5
                        console.log(">NOT_JOINED")
                        console.log(">WAIT JOIN")
                    } else {
                        joinState = loraJoin_State.JOIN_FAIL
                        txto = TX_TIMEOUT * 10
                        console.log("EV_JOIN_FAILED")
                        console.log(">WAIT REJOIN")
                    }
                    txrxpend = true
                }
                else if (txrxpend) {
                    if ((s & loraBit_Event.TX_COMPLETE) != 0) {
                        s = s - loraBit_Event.TX_COMPLETE
                        console.log("EV_TXCOMPLETE")
                        if (rxWindows) {
                            let len: number = 0
                            do {
                                basic.pause(200)
                                tmp = pins.createBuffer(1)
                                tmp[0] = loraBit_Cmd.GET
                                pins.i2cWriteBuffer(I2C_ADDR, tmp, false)
                                tmp = pins.i2cReadBuffer(I2C_ADDR, 1, true)
                            } while (tmp.length == 0)

                            len = tmp[0]

                            if (len > 0) {
                                tmp = pins.i2cReadBuffer(I2C_ADDR, len + 1, false)

                                if (tmp.length > 2) {
                                    ReceivedPort = tmp[1]
                                    ReceivedPayload = ''
                                    len = tmp.length - 2
                                    if (len > RX_PAYLOAD_MAX_LEN)
                                        len = RX_PAYLOAD_MAX_LEN
                                    for (let i = 0; i < len; i++)
                                        ReceivedPayload = ReceivedPayload + byteToHexString(tmp[i + 2])

                                    control.raiseEvent(LORA_EVENT_ID, 1)
                                    console.log("EV_RXCOMPLETE")
                                }
                            }
                        }
                        txrxpend = false
                    }
                }
            }
            loraStatus = s
        }
    })

    //%
    function writeByte(addr: number, register: number, value: number): void {
        let temp = pins.createBuffer(2);
        temp[0] = register;
        temp[1] = value;
        pins.i2cWriteBuffer(addr, temp, false);
    }

    //%
    function writeBuffer(addr: number, register: number, value: Buffer): void {
        let temp = pins.createBuffer(value.length + 1);
        temp[0] = register;
        for (let x = 0; x < value.length; x++) {
            temp[x + 1] = value[x];
        }
        pins.i2cWriteBuffer(addr, temp, false);
    }

    //%
    function readBuffer(addr: number, register: number, len: number): Buffer {
        let temp = pins.createBuffer(1);
        temp[0] = register;
        pins.i2cWriteBuffer(addr, temp, true);
        return pins.i2cReadBuffer(addr, len, false);
    }

    //%
    function getStatus(): number {
        basic.pause(200)
        return loraStatus
    }

    //%
    function pause(): void {
        loraStatusAck = false
        loraStatusPause++
        do {
            basic.pause(200)    //console.log("pause") //console.log(joinState.toString())
        } while (!loraStatusAck)
    }

    //%
    function resume(): void {
        loraStatusAck = false
        loraStatusPause--
        do {
            basic.pause(200)    //console.log("pause") //console.log(joinState.toString())
        } while (!loraStatusAck)
    }

    //%
    function do_reset(): boolean {
        let s = 0
        let t1: number
        let t0 = 5

        do {
            console.log(">RESET")
            writeByte(I2C_ADDR, loraBit_Cmd.RESET, 0)

            t1 = 20   //5sec (200ms unit)
            do {
                s = getStatus()
                t1--
            } while ((s != loraBit_Event.INITED) && (t1 > 0))
            t0--
        } while ((s != loraBit_Event.INITED) && (t0 > 0))

        if (s == loraBit_Event.INITED) {
            console.log("EV_RESET")
            return (true)
        }
        return (false)
    }

    /**
     * Reset loraBit
     */
    //% subcategory=Settings
    //% weight=100
    //% blockId="LoraBit_reset"
    //% block="Reset loraBit"
    export function reset(): void {
        txrxpend = true

        if (do_reset())
            joinState = loraJoin_State.RESET

        //rejoin = true
        txrxpend = false
    }

    /**
    * Set Configuration Parameter for The Air Authentication (OTAA)
    * @param Datarate[0-6]
    * @param Retrans[0-7]
    * @param ADR
    */
    //% subcategory=Settings
    //% weight=99
    //% help=loraBit/param_Config
    //% blockId="loraBit_param_Config"
    //% block="Set Configuration Parameter|Data Rate %Datarate|Retransmissions %Retrans|Adaptative Data Rate %ADR"
    //% Datarate.min=0 Datarate.max=6 Datarate.defl=2
    //% Retrans.min=0 Retrans.max=7 Retrans.defl=5
    //% ADR.defl=Off
    //% inlineInputMode=external
    export function param_Config(Datarate: number, Retrans: number, ADR: loraBit_ADR): void {
        config = (ADR * 64) + (Retrans % 8) * 8 + (Datarate % 8)    //(joinMode * 128) +
        rejoin = true
    }

    /**
     * Set Join Parameter for The Air Authentication (OTAA)
     * @param DevEUI Device EUI Unique 8 bytes, Hexstring BE
     * @param AppEUI Application EUI Unique 8 bytes, Hexstring BE
     * @param AppKey AppKey 86 bytes, Hexstring BE
     */
    //% subcategory=Settings
    //% weight=99
    //% help=loraBit/param_OTAA
    //% blockId="loraBit_param_OTAA"
    //% block="Set Join Parameter|Device EUI %DevEUI|Application EUI %AppEUI|App Key %AppKey"
    //% DevEUI.defl="0011223344556677" AppEUI.defl="0011223344556677" AppKey.defl="00112233445566778899AABBCCDDEEFF"
    export function param_OTAA(DevEUI: string, AppEUI: string, AppKey: string, dummy = 0): void {
        DEVEUI = HexStringToVal(DevEUI)
        APPEUI = HexStringToVal(AppEUI)
        APPKEY = HexStringToVal(AppKey)
        joinMode = 1
        rejoin = true
    }

    /**
     * Set Parameter for activating a device by personalization (ABP)
     * @param DevAddr Device Address Unique 4 bytes, Hexstring BE
     * @param NwkSKey Network Session Key 16 bytes, Hexstring BE
     * @param AppSKey App Session Key 16 bytes, Hexstring BE
     */
    //% subcategory=Settings
    //% weight=98
    //% help=loraBit/param_ABP
    //% blockId="loraBit_param_ABP"
    //% block="Set Session Parameter|Device Address %DevAddr|Network Session Key %NwkSKey|App Session Key %AppSKey"
    //% DevAddr.defl="00112233" NwkSKey.defl="00112233445566778899AABBCCDDEEFF" AppSKey.defl="00112233445566778899AABBCCDDEEFF"
    export function param_ABP(DevAddr: string, NwkSKey: string, AppSKey: string, NetID = 19): void {
        DEVADDR = HexStringToVal(DevAddr)
        NWKSKEY = HexStringToVal(NwkSKey)
        APPSKEY = HexStringToVal(AppSKey)
        NETID = NetID
        joinMode = 0
        rejoin = true
    }

    //%
    function do_join(): void {
        let s: number
        let tmp: Buffer
        let timeout: number

        if (joinState != loraJoin_State.RESET)
            if (do_reset()) joinState = loraJoin_State.RESET

        if (joinState == loraJoin_State.RESET) {
            console.log(">JOIN")
            pause()

            let tmp = pins.createBuffer(1)
            tmp[0] = config + (joinMode * 128)
            writeBuffer(I2C_ADDR, loraBit_Cmd.CONFIG, tmp)
            basic.pause(200)

            if (rejoin) {
                if (joinMode == loraJoin_Mode.ABP) {
                    writeBuffer(I2C_ADDR, loraBit_Cmd.DEVADDR_REG, DEVADDR)
                    basic.pause(200)

                    writeBuffer(I2C_ADDR, loraBit_Cmd.NWKSKEY_REG, NWKSKEY)
                    basic.pause(200)

                    writeBuffer(I2C_ADDR, loraBit_Cmd.APPSKEY_REG, APPSKEY)
                    basic.pause(200)

                    tmp = pins.createBuffer(4)
                    tmp.setNumber(NumberFormat.UInt32LE, 1, NETID);
                    writeBuffer(I2C_ADDR, loraBit_Cmd.NETID_REG, tmp)
                    basic.pause(200)
                }
                else {
                    writeBuffer(I2C_ADDR, loraBit_Cmd.DEVEUI_REG, DEVEUI)
                    basic.pause(200)

                    writeBuffer(I2C_ADDR, loraBit_Cmd.APPEUI_REG, APPEUI)
                    basic.pause(200)

                    writeBuffer(I2C_ADDR, loraBit_Cmd.APPKEY_REG, APPKEY)
                    basic.pause(200)
                }
            }

            console.log("EV_JOINING")
            writeByte(I2C_ADDR, loraBit_Cmd.JOIN, 0)

            resume()

            timeout = 3000     //10min (200ms unit)
            do {
                s = getStatus()
                timeout--
            } while ((joinState == loraJoin_State.RESET) && (timeout > 0))

            if (joinState == 2)   //loraJoin_State.JOINED
                rejoin = false
        }
    }

    /**
     * Join network
     */
    //% subcategory=Settings
    //% weight=100
    //% help=loraBit/join
    //% blockId="loraBit_join"
    //% block="Join Network"
    export function join(): void {
        txrxpend = true

        do_join()

        txrxpend = false
    }

    /**
     * When receive a LoRa packet
     * @param handler code to run
     */
    //% weight=98
    //% blockId="loraBit_whenReceived"
    //% block="When Receive"
    export function whenReceived(handler: Action) {
        rxWindows = true
        control.onEvent(LORA_EVENT_ID, 1, handler)
    }

    /**
     * Received Payload
     */
    //% weight=98
    //% blockId="loraBit_getReceivedPayload"
    //% block="Received Payload"
    //% icon="\uf085"
    export function getReceivedPayload(): string {
        return ReceivedPayload
    }

    /**
     * Received Port
     */
    //% weight=98
    //% blockId="loraBit_getReceivedPort"
    //% block="Received Port"
    //% icon="\uf085"
    export function getReceivedPort(): number {
        return ReceivedPort
    }

    /**
     * Send Confirmed/Unconfirmed LoRaWAN packet
     * @param confirmed Confirm
     * @param port LoRaWAN Port
     * @param payload Hex String
     */
    //% weight=99
    //% help=loraBit/sendPacket
    //% blockId="loraBit_sendPacket"
    //% block="Transmitt %confirmed| at Port %port| with Payload %payload"
    //% port.min=1 port.max=255
    //% port.defl=1
    export function sendPacket(confirmed: loraBit_Confirmed, port: number, payload: string): void {
        let tmp: Buffer
        /*
        console.log("join state=")
        console.log(joinState.toString())
        */
        if (txrxpend) {
            console.log(">Send packet: TXRX_PENDING")
        }
        else {
            if (rejoin) {
                console.log(">Send packet: Join require")
            }
            else {
                if (joinState != loraJoin_State.JOINED)
                    do_join()

                if (joinState == loraJoin_State.JOINED) {
                    pause()
                    txrxpend = true

                    let len = (payload.length / 2) + (payload.length % 2)
                    let buf: Buffer = pins.createBuffer(3 + len)

                    buf[0] = loraBit_Cmd.SEND
                    if (confirmed == loraBit_Confirmed.Uncomfirmed)
                        buf[1] = 0
                    else
                        buf[1] = 1
                    buf[2] = port

                    tmp = HexStringToVal(payload);
                    for (let i = 0; i < tmp.length; i++)
                        buf[i + 3] = tmp[i]

                    pins.i2cWriteBuffer(I2C_ADDR, buf, false);
                    console.log(">Send packet")

                    resume()
                }
            }
        }
    }

    /**
     * Pack string to Hex String.
     * @param text to convert, eg: "Hello"
     */
    //% weight=98
    //% help=loraBit/packHexString
    //% blockId="loraBit_packHexString"
    //% block="Pack Hexstring with Text|%text"
    //% icon="\uf085"
    export function packHexString(text: string): string {
        let hexstr = ""
        for (let i = 0; i < text.length; i++)
            hexstr = hexstr + byteToHexString(text.charCodeAt(i))
        return hexstr
    }
}

/**
 * Custom blocks
 */
//% weight=90 color=#0fbc11 icon="\uf0ee"
namespace PM_Sensor {
    /**
    * TODO: get pm2.5(μg/m³)
    * @param pm25pin describe parameter here, eg: DigitalPin.P11
    */
    //% blockId="readpm25" block="read pm2.5(μg/m³) at pin %pm25pin"
    export function ReadPM25(pm25pin: DigitalPin): number {
        let pm25 = 0
        let waitio = 30000
        while ((pins.digitalReadPin(pm25pin) != 0) && (waitio != 0)) {
            waitio--
        }
        waitio = 30000
        while ((pins.digitalReadPin(pm25pin) != 1) && (waitio != 0)) {
            waitio--
        }
        waitio = 30000
        pm25 = input.runningTimeMicros()
        while ((pins.digitalReadPin(pm25pin) != 0) && (waitio != 0)) {
            waitio--
        }

        if (waitio != 0) {
            pm25 = input.runningTimeMicros() - pm25
            pm25 = pm25 / 1000 - 2
            return 998 - pm25;
        }

        return 0;
    }

    /**
    * TODO: get pm10(μg/m³)
    * @param pm10pin describe parameter here, eg: DigitalPin.P12     */
    //% blockId="readpm10" block="read pm10(μg/m³) at pin %pm10pin"
    export function ReadPM10(pm10pin: DigitalPin): number {
        let pm10 = 0
        let waitio = 30000
        while ((pins.digitalReadPin(pm10pin) != 0) && (waitio != 0)) {
            waitio--
        }
        waitio = 30000
        while ((pins.digitalReadPin(pm10pin) != 1) && (waitio != 0)) {
            waitio--
        }
        waitio = 30000
        pm10 = input.runningTimeMicros()
        while ((pins.digitalReadPin(pm10pin) != 0) && (waitio != 0)) {
            waitio--
        }

        if (waitio != 0) {
            pm10 = input.runningTimeMicros() - pm10
            pm10 = pm10 / 1000 - 2
            return 998 - pm10;
        }

        return 0;
    }
}
