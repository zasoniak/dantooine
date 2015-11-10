/**
 * Created by Mateusz on 17.09.2015.
 */

var Device = require('../database/database').Device;

module.exports.initialize = function (callback) {

};

module.exports.findDevices = function (callback) {

};

module.exports.wakeUpAndSetAuthorization = function (groupNo, callback) {
    var self = this;
    Device.findOne({'peripheral.connected': false}).exec(function (device, err) {
        if (err) return callback(err);
        device.connect(function (err2) {
            if (err2) return callback(err2);
            device.setAuthorization(groupNo, function (err3) {
                if (err3) return callback(err3);
                self.connectedDevices.push(device);
                return callback(null);
            });
        });
    });
};

module.exports.disconnectLastDevice = function (callback) {
    var self = this;
    var deviceToDisconnect = self.connectedDevices.pop();
    deviceToDisconnect.disconnect(callback);
};

module.exports.disconnectAllDevices = function (callback) {
    var self = this;
    async.each(self.connectedDevices, function (device, callback2) {
        device.disconnect(callback2);
    }, function (err) {
        if (err) return callback(err);
        return callback(null);
    });
};

module.exports.sleepDevices = function (callback) {
    var self = this;
    async.each(self.connectedDevices, function (device, callback2) {
        device.sleep(callback2);
    }, function (err) {
        if (err) return callback(err);
        return callback(null);
    });
};


module.exports.startVoting = function (groupNo, callback) {
    var self = this;
    async.each(self.connectedDevices, function (device, callback2) {
        if (device.groupNo <= groupNo) {
            device.startVoting(callback2);
        }
    }, function (err) {
        if (err) return callback(err);
        return callback(null);
    });
};

module.exports.endVoting = function (callback) {
    var self = this;
    async.each(self.connectedDevices, function (device, callback2) {
        device.endVoting(callback2);
    }, function (err) {
        if (err) return callback(err);
        return callback(null);
    });
};

module.exports.nextSubQuestion = function (callback) {
    var self = this;
    async.each(self.connectedDevices, function (device, callback2) {
        if (device.isVotingActive == true) {
            device.nextSubQuestion(callback2);
        }
    }, function (err) {
        if (err) return callback(err);
        return callback(null);
    });

};

//TODO:
//on('read') -> odpowiedz na pytanie
//notify -> stan baterii


var noble = require('noble');
noble.on('stateChange', function (state) {
    console.log(state);
    if (state === 'poweredOn') {
        noble.startScanning([], true);
    } else {
        noble.stopScanning();
    }
});

var BluetoothHciSocket = require('bluetooth-hci-socket');

var bluetoothHciSocket = new BluetoothHciSocket();

var STATUS_MAPPER = [
    'success',
    'unknown command',
    'not connected',
    'failed',
    'connect failed',
    'auth failed',
    'not paired',
    'no resources',
    'timeout',
    'already connected',
    'busy',
    'rejected',
    'not supported',
    'invalid params',
    'disconnected',
    'not powered',
    'cancelled',
    'invalid index',
    'rfkilled',
    'already paired',
    'permission denied'
];

var MGMT_INDEX_NONE = 0xFFFF;

var MGMT_OP_READ_VERSION = 0x0001;
var MGMT_OP_LOAD_LONG_TERM_KEYS = 0x0013;

bluetoothHciSocket.on('data', function (data) {
    console.log('on -> data: ' + data.toString('hex'));

    var index = data.readUInt16LE(2);
    var length = data.readUInt16LE(4);
    var opcode = data.readUInt16LE(6);
    var status = data.readUInt8(8);

    console.log('\tindex = ' + index);
    console.log('\tlength = ' + length);
    console.log('\topcode = ' + opcode);
    console.log('\tstatus = ' + status + ' (' + STATUS_MAPPER[status] + ')');

    data = data.slice(9);

    if (data.length) {
        if (opcode === MGMT_OP_READ_VERSION) {
            var version = data.readUInt8(0);
            var revision = data.readUInt16LE(1);

            console.log('\t\tversion = ' + version);
            console.log('\t\trevision = ' + revision);
        } else {
            console.log('\t\tdata = ' + data.toString('hex'));
        }
    }

    console.log();
});

bluetoothHciSocket.on('error', function (error) {
    console.log('on -> error: ' + error.message);
});

function write(opcode, index, data) {
    var length = 0;

    if (data) {
        length += data.length;
    }

    var pkt = new Buffer(6 + length);

    pkt.writeUInt16LE(opcode, 0);
    pkt.writeUInt16LE(index, 2);
    pkt.writeUInt16LE(length, 4);

    if (length) {
        data.copy(pkt, 6);
    }

    console.log('writing -> ' + pkt.toString('hex'));
    bluetoothHciSocket.write(pkt);
}

function readVersion() {
    write(MGMT_OP_READ_VERSION, MGMT_INDEX_NONE);
}

bluetoothHciSocket.start();
bluetoothHciSocket.bindControl();

readVersion();