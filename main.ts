loraBit.whenReceived(function () {
    cayenneLPP.lpp_update(loraBit.getReceivedPayload())
})
input.onButtonPressed(Button.B, function () {
    loraBit.reset()
    loraBit.param_Config(
    2,
    1,
    loraBit_ADR.On
    )
    loraBit.param_OTAA(
    "00F8361A0B832941",
    "70B3D57ED0018FB9",
    "757E83314D84675319AAE1DC76536075"
    )
    loraBit.join()
})
input.onButtonPressed(Button.A, function () {
    loraBit.reset()
    loraBit.param_Config(
    2,
    5,
    loraBit_ADR.On
    )
    loraBit.param_ABP(
    "26041239",
    "ED8364C28F8D93E3693903531480121A",
    "F0E832C43FAD48299CCC9F765254B72A"
    )
    loraBit.join()
})
input.onButtonPressed(Button.AB, function () {
    loraBit.reset()
    loraBit.param_Config(
    2,
    1,
    loraBit_ADR.On
    )
    loraBit.param_OTAA(
    "343137326436900F",
    "70B3D57ED0007650",
    "723BFEED40D7E244B21343889947F457"
    )
    loraBit.join()
})
function sendData() {
    BME280.PowerOn()
    basic.pause(5000)
    images.createImage(`
        . . . . #
        . . . . #
        . . . # #
        . . # # #
        # # # # #
        `).scrollImage(1, 20)
    loraBit.sendPacket(loraBit_Confirmed.Uncomfirmed, 1, "" + cayenneLPP.lpp_upload() + cayenneLPP.lpp(
    LPP_DATA_TYPE.Temperature,
    76,
    BME280.temperature()
    ) + cayenneLPP.lpp(
    LPP_DATA_TYPE.Humidity,
    77,
    BME280.humidity()
    ) + cayenneLPP.lpp(
    LPP_DATA_TYPE.Pressure,
    78,
    BME280.pressure() / 100
    ))
    BME280.PowerOff()
    basic.clearScreen()
}
led.setBrightness(10)
basic.showString("loraBit demo")
BME280.Address(BME280_I2C_ADDRESS.ADDR_0x76)
cayenneLPP.register_digital(LPP_Direction.Output_Port, DigitalPin.P1)
cayenneLPP.register_sensor(LPP_Bit_Sensor.LED_Brightness)
basic.clearScreen()
basic.forever(function () {
    basic.pause(5000)
    sendData()
})
