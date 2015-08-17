    var bleno = require('bleno');
    var net = require('net');

    var tcpHost = '127.0.0.1';
    var tcpPort = 3000;
    var tcpClient = new net.Socket();

    var temp = '0';
    var sendTempData = null;

    tcpClient.connect(tcpPort, tcpHost, function() {
        console.log('SOCKET CONNECTED TO: ' + tcpHost + ':' + tcpPort);
    });

    tcpClient.on('data', function(data) {
        temp = data;
    });

    bleno.on('stateChange', function(state) {
        console.log('on -> stateChange: ' + state);
        if (state === 'poweredOn') {
            bleno.startAdvertising('Edison',['0000280000001000800000805f9b34fb']);
        } else {
            bleno.stopAdvertising();
        }
    });

    bleno.on('advertisingStart', function(error) {
        console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));
        if (!error) {
            bleno.setServices([
                new bleno.PrimaryService( {
                    uuid : '0000280000001000800000805f9b34fb',
                    characteristics : [
                        new bleno.Characteristic( {
                            uuid : '0000333300001000800000805f9b34fb',
                            properties : ['write','writeWithoutResponse','notify'],

                                onWriteRequest : function(data, offset, withoutResponse, callback) {

                                    var notifyFlg = data.toString('ascii');
                                    console.log('write request: ' + data[0] + ',' + notifyFlg);
                                    tcpClient.write(notifyFlg);

                                    if (null != sendTempData) {
                                        sendTempData(temp);
                                        console.log(' Temparture :' + temp);
                                    }

                                    callback(bleno.Characteristic.RESULT_SUCCESS);
                                },
                                
                                onSubscribe : function(maxValueSize, updateValueCallback) {

                                    console.log('Notification on');
                                    sendTempData = updateValueCallback;

                                }
                        })
                    ]
                })
            ]);
        }
    });

    bleno.on('advertisingStop', function() {
      console.log('bleno on -> advertisingStop');
    });

    bleno.on('servicesSet', function() {
      console.log('bleno on -> servicesSet');
    });