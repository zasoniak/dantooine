/**
 * Created by konrad on 02.01.16.
 */



function BluetoothController() {

}

BluetoothController.prototype.startSession = function (session) {
    BLElog('sesja '+session.name+' rozpooczęta.');
};

BluetoothController.prototype.wakeUpAndSetAuthorization = function (device, callback) {
    BLElog('obudzenie urządzenia.');
    return callback(null);

};

BluetoothController.prototype.turnOffLastDevice = function (callback) {
    BLElog('urządzenie wyłączone.');
    return callback(null);
};

BluetoothController.prototype.reset = function (callback) {
    BLElog('reset.');
    return callback(null);
};

BluetoothController.prototype.disconnectAllDevices = function (callback) {
    BLElog('odłączam urządzenia.');
    return callback(null);

};

BluetoothController.prototype.prepareVoting = function (voting, callback) {
    BLElog('przygotowuję następne głosowanie.');
    return callback(null);

};

BluetoothController.prototype.startVoting = function (question, callback) {
    BLElog('głosowanie rozpoczęte.');
    return callback(null);
};

BluetoothController.prototype.endVoting = function (callback) {
    BLElog('głosowanie zakończone.');
    return callback(null);

};

BluetoothController.prototype.startNextSubQuestion = function (callback) {
    BLElog('następny wariant odpowiedzi.');
    return callback(null);

};

function BLElog(msg) {
    console.log('Bluetooth: '+msg);
}

module.exports = BluetoothController;