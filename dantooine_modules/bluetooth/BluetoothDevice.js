/**
 * Created by Mateusz on 10.11.2015.
 */



var BTDevice = require('noble').Peripheral;

var CHARACTERISTICS =
{
    DEVICE_POWER_ON_STATE: "",
    BATTERY_LEVEL: "",
    AUTHORIZATION_LEVEL: "",
    //SINGLE_QUESTION_FLAG:"",
    VOTE: "",
    QUESTION_IS_ACTIVE: "",
    ANSWERS_PERMITTED_NUMBER: "",
    NEXT_QUESTION: ""
};

var SERVICES =
{
    DEVICE_STATE: "",
    BATTERY: "",
    AUTHORIZATION: "",
    VOTING: ""
};


var BluetoothDevice = function () {
    var self = this;
    self.isVotingActive = false;
    self.groupNo = 10;
    self.peripheral = new BTDevice(a, b, c, d, f, g);
    self.services = {};
    self.characteristics = {};
};


BluetoothDevice.prototype.connect = function (callback) {
    this.peripheral.connect(function (err) {
//discover services
//discover characteristics
    });
};


BluetoothDevice.prototype.setAuthorization = function (groupNo, callback) {
    this.characteristics[CHARACTERISTICS.AUTHORIZATION_CHARACTERISTIC].write(groupNo, false, callback);
};

BluetoothDevice.prototype.disconnect = function (callback) {
    this.peripheral.disconnect(callback);
};

BluetoothDevice.prototype.sleep = function (callback) {

};

BluetoothDevice.prototype.startVoting = function (answersAllowed, callback) {
    var context = this;
    context.characteristics[CHARACTERISTICS.NEXT_QUESTION].write(1, false, function (err) {
        if (err) return callback(err);
        context.characteristics[CHARACTERISTICS.QUESTION_IS_ACTIVE].write(1, false, callback);
    });
};


BluetoothDevice.prototype.startQuestion = function (callback) {
    this.characteristics[CHARACTERISTICS.QUESTION_IS_ACTIVE].write(true, false, callback);
};

BluetoothDevice.prototype.endQuestion = function (callback) {
    var context = this;
    this.characteristics[CHARACTERISTICS.VOTE].read(function (err, data) {
        if (err) return callback(err, null);
        //TODO: data transform?!
        context.characteristics[CHARACTERISTICS.QUESTION_IS_ACTIVE].write(0, false, function (err2) {
            if (err2) return callback(err2, null);
            return callback(null, data);
        });
    });
};


BluetoothDevice.prototype.endVoting = function (callback) {
    var context = this;
    this.characteristics[CHARACTERISTICS.VOTE].read(function (err, data) {
        if (err) return callback(err, null);
        //TODO: data transform?!
        context.characteristics[CHARACTERISTICS.QUESTION_IS_ACTIVE].write(0, false, function (err2) {
            if (err2) return callback(err2, null);
            return callback(null, data);
        });
    });
};

/**
 *
 * @param answersAllowedNumber
 * @param callback
 */
BluetoothDevice.prototype.nextVoting = function (answersAllowedNumber, callback) {
    var context = this;
    context.characteristics[CHARACTERISTICS.NEXT_QUESTION].write(1, false, function (err2) {
        if (err2) return callback(err2, null);
        return callback(null, data);
    });
};

/**
 *
 * @param callback
 */
BluetoothDevice.prototype.getVote = function (callback) {
    var context = this;
    context.characteristics[CHARACTERISTICS.VOTE].read(function (err, data) {
        if (err) return callback(err, null);
        //TODO: transform data
        return callback(null, data);
    })
}