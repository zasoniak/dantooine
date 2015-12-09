/**
 * Created by Mateusz on 17.09.2015.
 */


function BluetoothController() {
}

BluetoothController.prototype.startSession = function (session) {
    BLElog('sesja '+session.name+' rozpooczęta.');
};

BluetoothController.prototype.turnOnDevice = function (device, callback) {
    BLElog('urządzenie włączone.');
    return callback(null);

};

BluetoothController.prototype.turnOffLastDevice = function (callback) {
    BLElog('urządzenie wyłączone.');
    return callback(null);
};

BluetoothController.prototype.turnOnDeviceForExtraVvoter = function (device, callback) {
    BLElog('dodatkowe urzadzenie włączone.');
    return callback(null);
};

BluetoothController.prototype.endSession = function (callback) {
    BLElog('sesja zakończona.');
    return callback(null);

};

BluetoothController.prototype.nextVoting = function (voting, callback) {
    BLElog('następne głosowanie.');
    return callback(null);

};

BluetoothController.prototype.startVoting = function (callback) {
    BLElog('głosowanie rozpoczęte.');
    return callback(null);

};

BluetoothController.prototype.stopVoting = function (callback) {
    BLElog('głosowanie zakończone.');
    return callback(null);

};

BluetoothController.prototype.nextSubquestion = function (callback) {
    BLElog('następny wariant odpowiedzi.');
    return callback(null);

};

function BLElog(msg) {
    console.log('Bluetooth: '+msg);
}

module.exports = BluetoothController;