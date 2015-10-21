/**
 * Created by Mateusz on 17.09.2015.
 */

var noble = require('noble');



var serviceUUID =
{
    DeviceStateService: "",
    BatteryService: "",
    AuthorizationService: "",
    VotingService:""
};

var characteristicUUID =
{
    DevicePowerOnState:"",
    BatteryLevel:"",
    AuthorizationLevelCharacteristic:"",
    SingleQuestionFlag:"",
    VoteCharacteristic:"",
    QuestionIsActiveCharacteristic:"",
    AnswersPermittedNumberCharacteristic:""
};


var devices = [];





noble.on('stateChange', function (state) {
    console.log(state);
    if (state === 'poweredOn') {
        noble.startScanning([], true);
    } else {
        noble.stopScanning();
    }
});

noble.on('discover', function(peripheral) {
    var remembered = !devices[peripheral.id];
    if(remembered)
        devices[peripheral.id]=peripheral;
});

module.exports.initialize = function (callback) {
//skanuje i zapamietuje urzadzenia
    if(noble.state=='poweredOn')
        noble.startScanning([], true);
};

module.exports.updateDevices = function(callback)
{

}

/**
 *
 * @param groupsCount - JSONArray like [{ groupNumber: deviceCount}] with number of devices on every authorization level
 * @param callback  - callback function with format function(error, returnValue)
 */
module.exports.setUpAuthorization = function (groupsCount, callback) {

var groups = groupsCount;

for(var it=0; it<groups.length;it++)
{

}
//dla kazdego urzadzenia lecimy pokolei i przypisujemy dane

};

module.exports.wakeUpDevices = function (callback) {

};

module.exports.sleepDevices = function (callback) {

};

module.exports.prepareVoting = function (votingID, callback) {


};

module.exports.startVoting = function (votingID, callback) {

};

module.exports.endVoting = function (votingID, callback) {
    for(var it=0;it<devices.length;it++)
    {
        devices[it].characteristics[characteristicUUID.VoteCharacteristic].read(function(err, data)
        {
            if(err) return;

            //dodac odpowiedz do bazy
            devices[it].characteristics[characteristicUUID.QuestionIsActiveCharacteristic].write(false,false,function(err)
            {

            });
        })
    }

};


