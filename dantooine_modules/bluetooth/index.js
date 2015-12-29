/**
 * Created by Mateusz on 17.09.2015.
 */

/**
 * dependencies
 */
var noble = require('noble');
var async = require('async');
var io = require('socket.io-client');


var BLUETOOTH_CONTROLLER_STATE =
{
    IDLE: 0,
    WAKE_UP_DEVICE: 1,
    RECONNECT_DEVICE: 2,
    NEXT_QUESTION: 3,
    START_QUESTION: 4,
    END_QUESTION: 5,
    NEXT_VOTING: 6
};


var SERVICES =
{
    DeviceStateService: "",
    BatteryService: "",
    AUTHORIZATION: "6c396b0677c611e58bcffeff819cdc9f",
    VOTING: "6c396f9877c611e58bcffeff819cdc9f"
};

var CHARACTERISTICS =
{
    DevicePowerOnState: "",
    BatteryLevel: "",
    AUTHORIZATION_LEVEL: "6c396d1877c611e58bcffeff819cdc9f",
    SINGLE_QUESTION_FLAG: "6c396dea77c611e58bcffeff819cdc9f",
    VOTE: "6c3971c877c611e58bcffeff819cdc9f",
    QUESTION_IS_ACTIVE: "6c3972b877c611e58bcffeff819cdc9f",
    ANSWERS_PERMITTED_NUMBER: "6c3974e877c611e58bcffeff819cdc9f"
};

/**
 *
 * @constructor
 */

function BluetoothController() {
    this._state = 0;
    this._connected = {};
    this._noble = noble;
    this._currentParameters = {};
    this._currentCallback = null;
    var self = this;

    this._socket = io.connect('http://localhost:8081');
    this._socket.on('connect', function () {
        console.log('Połączono blu z serwerem :D');
    });

    this._noble.on('discover', function (peripheral) {
            switch (self._state) {
                case BLUETOOTH_CONTROLLER_STATE.IDLE:
                    self._noble.stopScanning();
                    break;
                case BLUETOOTH_CONTROLLER_STATE.WAKE_UP_DEVICE:
                {
                    self._noble.stopScanning();
                    peripheral.connect(function (error) {
                        if (error) return self._currentCallback(error, null);
                        self._connected[peripheral.id] = {};
                        self._connected[peripheral.id].peripheral = peripheral;
                        peripheral.discoverAllServicesAndCharacteristics(function (error, services, characteristics) {
                            self._connected[peripheral.id].characteristics = [];
                            self._connected[peripheral.id].characteristics = characteristics;
                            self._connected[peripheral.id].services = [];
                            self._connected[peripheral.id].services = services;
                            setupCharacteristicsForNewDevice(self._connected[peripheral.id].characteristics, self._currentParameters.groupNo, self._socket, function (err) {
                                if (err) return self._currentCallback(err, null);
                                console.log('przydzielamy uprawnienia');
                                self._connected[peripheral.id].groupNo = self._currentParameters.groupNo;
                                return self._currentCallback(null, peripheral.id);
                            });
                        });
                    });
                    break;
                }
                case BLUETOOTH_CONTROLLER_STATE.RECONNECT_DEVICE:
                {
                    if (self._connected[peripheral.id] != null) {
                        peripheral.connect(function (error) {
                            if (error) return self._currentCallback(error);
                            self._connected[peripheral.id].peripheral = peripheral;
                            peripheral.discoverAllServicesAndCharacteristics(function (error, services, characteristics) {
                                self._connected[peripheral.id].characteristics = characteristics;
                                self._connected[peripheral.id].services = services;
                                self._connected[peripheral.id].characteristics.forEach(function (characteristic) {
                                    if (characteristic.uuid == CHARACTERISTICS.AUTHORIZATION_LEVEL) {
                                        console.log('przydzielamy ponownie uprawnienia');
                                        var temp = new Buffer(1);
                                        temp.writeUInt8(self._connected[peripheral.id].groupNo, 0);
                                        characteristic.write(temp, false, function (err) {
                                            if (err) {
                                                console.log('write error');
                                            }
                                        });
                                    }
                                    if (characteristic.uuid == CHARACTERISTICS.VOTE) {
                                        characteristic.notify(true);
                                        characteristic.on('data', function (data, isNofication) {
                                            if (data.length === 1) {
                                                var result = data.readUInt8(0);
                                                console.log('odczyt glosu ' + result);
                                            }
                                        })
                                    }
                                });
                            });
                        });
                    }
                    break;
                }
            }
        }
    )
}

/**
 * Clears all settings inside BluetoothController. Disconnects all devices as well.
 * @param callback - function(error) if anything goes wrong, error will be returned.
 */
BluetoothController.prototype.reset = function (callback) {
    var self = this;
    this.disconnectAllDevices(function (err) {
        if (err) callback(err);
        self._state = 0;
        self._connected = {};
        self._currentParameters = {};
        self._currentCallback = null;
        return callback(null);
    });
};

/**
 * Wakes up one device and sets up its authorization property.
 * <p>
 *     Used for preparing voting device for new voter. Returns error in callback if device could not be initialized properly.
 *     If succeeded returns an ID number of device connected.
 *
 * @param groupNo - authorization level to be assigned to the voting device
 * @param callback - function(error, peripheralID) where peripheralID is an ID number of device connected
 */
BluetoothController.prototype.wakeUpAndSetAuthorization = function (groupNo, callback) {
    var self = this;
    self._noble.on('stateChange', function (state) {
        if (state === 'poweredOn') {
            self._state = BLUETOOTH_CONTROLLER_STATE.WAKE_UP_DEVICE;
            self._currentParameters = {groupNo: groupNo};
            self._currentCallback = callback;
            noble.startScanning();
            console.log("BLE start scanning");
        }
        else {
            noble.stopScanning();
            var error = "Bluetooth turned off";
            return callback(error, null);
        }
    });
    if (self._noble.state === 'poweredOn') {
        self._state = BLUETOOTH_CONTROLLER_STATE.WAKE_UP_DEVICE;
        self._currentParameters = {groupNo: groupNo};
        self._currentCallback = callback;
        noble.startScanning();
        console.log("BLE start scanning");
    }
    else {
        noble.stopScanning();
        var error = "Bluetooth turned off";
        return callback(error, null);
    }
};


/**
 * Disconnects all devices.
 * <p>
 *     Disconnects all currently connected devices. Returns error in callback or null if action succeed.
 * @param callback - function(error)
 */
BluetoothController.prototype.disconnectAllDevices = function (callback) {
    var self = this;
    async.each(self._connected, function (device, callback2) {
        device.peripheral.disconnect(callback2);
    }, function (err) {
        if (err) return callback(err);
        return callback(null);
    });
};

BluetoothController.prototype.reconnectAllDevices = function (callback) {
    var self = this;
    async.each(Object.keys(self._connected), function (uuid, callback2) {
        self._connected[uuid].peripheral.connect(function (error) {
            if (error) callback2(error);
            self._connected[uuid].peripheral.discoverAllServicesAndCharacteristics(function (error, services, characteristics) {
                self._connected[uuid].characteristics = characteristics;
                self._connected[uuid].services = services;
                callback2(null);
            });
        });
    }, function (err) {
        if (err) return callback(err);
        return callback(null);
    });

};


BluetoothController.prototype.disconnectDevice = function (peripheralID, callback) {
    var self = this;
    self._connected[peripheralID].disconnect(callback);
};



/**
 * Start voting
 * <p>
 *     Setup voting devices with sufficient authorization. Sends information about maximal possible answers. Marks voting as active.
 * @param question - JSON with information about question {id: questionID, groupNo: requiredAuthorizationLevel, possibleAnswers: maximalNumberOfPositiveAnswers, extraVoters: [peripheralID]} if single question voting set possibleAnswers to 1, if no extra voters leave extraVoters as empty array []
 * @param callback - function(err)
 */
BluetoothController.prototype.startVoting = function (question, callback) {
    var self = this;
    self._currentParameters = {
        groupNo: question.groupNo,
        possibleAnswers: question.possibleAnswers,
        questionId: question.id,
        extraVoters: question.extraVoters
    };
    var beginTime = new Date().getTime();
    async.series([
        function (callback2) {
            async.each(self._currentParameters.extraVoters, function (uuid, callback3) {
                //if (self._connected[uuid].peripheral.state == 'disconnected') {
                reconnectDevice(self._connected[uuid], self._socket, function (err) {
                    if (err) callback3(err);
                    console.log('reconnected after: ' + (new Date().getTime() - beginTime));
                    setupCharacteristicsToStartVotingForExtraVoter(self._connected[uuid].characteristics, self._currentParameters.possibleAnswers, self._currentParameters.groupNo, callback3);
                });
                //}
                //setupCharacteristicsToStartVotingForExtraVoter(self._connected[uuid].characteristics, self._currentParameters.possibleAnswers, self._currentParameters.groupNo, callback3);
            }, function (err) {
                if (err) return callback2(err);
                callback2(null);
            })
        },
        function (callback2) {
            async.each(Object.keys(self._connected), function (uuid, callback3) {
                if (self._connected[uuid].groupNo <= self._currentParameters.groupNo) {
                    console.log('reconnecting after: ' + (new Date().getTime() - beginTime));
                    //if (self._connected[uuid].peripheral.state == 'disconnected') {
                    setupCharacteristicsToStartVoting(self._connected[uuid].characteristics, self._currentParameters.possibleAnswers, self._currentParameters.groupNo, function (err) {
                        if (err) return callback3(err);
                        console.log('setup after:' + (new Date().getTime() - beginTime));
                        callback3(null);
                    });
                    //reconnectDevice(self._connected[uuid], self._voteCallback, function (err) {
                    //    if (err) callback3(err);
                    //    console.log('reconnected after: ' + (new Date().getTime() - beginTime));
                    //    setupCharacteristicsToStartVoting(self._connected[uuid].characteristics, self._currentParameters.possibleAnswers, self._currentParameters.groupNo, function (err) {
                    //        if (err) return callback3(err);
                    //        console.log('setup after:' + (new Date().getTime() - beginTime));
                    //        callback3(null);
                    //    });
                    //});
                }
                //setupCharacteristicsToStartVoting(self._connected[uuid].characteristics, self._currentParameters.possibleAnswers, self._currentParameters.groupNo, callback3);
                //}
                else callback3(null);
            }, function (err) {
                if (err) return callback2(err);
                callback2(null);
            })
        }
    ], function (err) {
        if (err) return callback(err);
        return callback(null);
    });
};


/**
 * Starts voting for next sub-question
 * <p>
 *     Marks voting as active for voting devices with sufficient authorization level
 * @param callback - function(error)
 */
BluetoothController.prototype.startNextSubQuestion = function (callback) {
    var self = this;
    async.series([
        function (callback2) {
            async.each(self._currentParameters.extraVoters, function (uuid, callback3) {
                setupCharacteristicsToStartNextSubQuestionForExtraVoter(self._connected[uuid].characteristics, self._currentParameters.groupNo, callback3);
            }, function (err) {
                if (err) callback2(err);
                callback2(null);
            })
        },
        function (callback2) {
            async.each(Object.keys(self._connected), function (uuid, callback3) {
                if (self._connected[uuid].groupNo <= self._currentParameters.groupNo)
                    setupCharacteristicsToStartNextSubQuestion(self._connected[uuid].characteristics, self._currentParameters.groupNo, callback3);
                else callback3(null);
            }, function (err) {
                if (err) callback2(err);
                callback2(null);
            })
        }
    ], function (err) {
        if (err) return callback(err);
        return callback(null);
    });
};

/**
 * Ends current voting.
 * <p>
 *     Doesn't change any data. Just ends voting and blocks voting devices.
 * @param callback - function(error)
 */
BluetoothController.prototype.endVoting = function (callback) {
    var self = this;
    async.each(Object.keys(self._connected), function (uuid, callback2) {
        setupCharacteristicsToEndVoting(self._connected[uuid].characteristics, callback2);
    }, function (err) {
        if (err) return callback(err);
        return callback(null);
    });
};


// ============================================================================================================== //
// ============================================================================================================== //
//                                              PRIVATE SECTION                                                   //
// ============================================================================================================== //
// ============================================================================================================== //

function reconnectDevice(device, voteCallback, callback) {
    device.peripheral.connect(function (err) {
        if (err) return callback(err);
        device.peripheral.discoverAllServicesAndCharacteristics(function (error, services, characteristics) {
            if (error) return callback(error);
            device.characteristics = characteristics;
            device.services = services;
            setupCharacteristicsForNewDevice(device.characteristics, device.groupNo, voteCallback, function (err) {
                if (err) return callback(err);
                return callback(null);
            });
        });
    });
}


function setupCharacteristicsToEndVoting(characteristics, callback) {
    var temp = new Buffer(1);
    temp.writeUInt8(0, 0);
    characteristics.forEach(function (characteristic) {
        if (characteristic.uuid == CHARACTERISTICS.QUESTION_IS_ACTIVE) {
            characteristic.write(temp, false, function (err) {
                if (err) return callback(err);
                characteristics.forEach(function (characteristic2) {
                    if (characteristic2.uuid == CHARACTERISTICS.SINGLE_QUESTION_FLAG) {
                        characteristic2.write(temp, false, function (err) {
                            if (err)  return callback(err);
                            callback(null);
                        });
                    }
                });
            });
        }
    });
}

function setupCharacteristicsToStartVotingForExtraVoter(characteristics, possibleAnswers, groupNo, callback) {
    setupCharacteristicsToStartVoting(characteristics, possibleAnswers, groupNo, function (err) {
        if (err) return callback(err);
        characteristics.forEach(function (characteristic) {
            if (characteristic.uuid == CHARACTERISTICS.SINGLE_QUESTION_FLAG) {
                var temp = new Buffer(1);
                temp.writeUInt8(1, 0);
                characteristic.write(temp, false, function (err) {
                    if (err) return callback(err);
                    return callback(null);
                });
            }
        });
    });
}

function setupCharacteristicsToStartVoting(characteristics, possibleAnswers, groupNo, callback) {
    characteristics.forEach(function (characteristic) {
        if (characteristic.uuid == CHARACTERISTICS.ANSWERS_PERMITTED_NUMBER) {
            var temp1 = new Buffer(1);
            temp1.writeUInt8(possibleAnswers, 0);
            characteristic.write(temp1, false, function (err) {
                if (err) return callback(err);
                characteristics.forEach(function (characteristic2) {
                    if (characteristic2.uuid == CHARACTERISTICS.QUESTION_IS_ACTIVE) {
                        var temp2 = new Buffer(1);
                        temp2.writeUInt8(groupNo, 0);
                        characteristic2.write(temp2, false, function (err) {
                            if (err) return callback(err);
                            return callback(null);
                        });
                    }
                });
            })
        }
    });
}

function setupCharacteristicsToStartNextSubQuestionForExtraVoter(characteristics, groupNo, callback) {
    setupCharacteristicsToStartNextSubQuestion(characteristics, groupNo, function (err) {
        if (err) return callback(err);
        characteristics.forEach(function (characteristic) {
            if (characteristic.uuid == CHARACTERISTICS.SINGLE_QUESTION_FLAG) {
                var temp = new Buffer(1);
                temp.writeUInt8(1, 0);
                characteristic.write(temp, false, function (err) {
                    if (err) return callback(err);
                    return callback(null);
                });
            }
        });
    });
}

function setupCharacteristicsToStartNextSubQuestion(characteristics, groupNo, callback) {
    var temp = new Buffer(1);
    temp.writeUInt8(groupNo, 0);
    characteristics.forEach(function (characteristic) {
        if (characteristic.uuid == CHARACTERISTICS.QUESTION_IS_ACTIVE) {
            characteristic.write(temp, false, function (err) {
                if (err) callback(err);
                callback(null);
            });
        }
    })
}

function setupCharacteristicsForNewDevice(characteristics, groupNo, voteCallback, callback) {
    characteristics.forEach(function (characteristic) {
        if (characteristic.uuid == CHARACTERISTICS.AUTHORIZATION_LEVEL) {
            var temp = new Buffer(1);
            temp.writeUInt8(groupNo, 0);
            characteristic.write(temp, false, function (err) {
                if (err) return callback(err);
                characteristics.forEach(function (characteristic2) {
                    if (characteristic2.uuid == CHARACTERISTICS.VOTE) {
                        characteristic2.notify(true, function (err) {
                            if (err) return callback(err);
                            characteristic2.on('data', function (data, isNofication) {
                                if (data.length === 1) {
                                    var result = data.readUInt8(0);
                                    console.log("przyszlo {}",result);
                                    //self.voteCallback({plepelpel});
                                    voteCallback.emit('voted',{id: characteristic2._peripheralId, vote: result});
                                }
                            });
                            return callback(null);
                        });
                    }
                });
            });
        }
    });
}



//
//BluetoothController.prototype.startSession = function (session) {
//    BLElog('sesja '+session.name+' rozpooczęta.');
//};
//
//BluetoothController.prototype.turnOnDevice = function (device, callback) {
//    BLElog('urządzenie włączone.');
//    return callback(null);
//
//};
//
//BluetoothController.prototype.turnOffLastDevice = function (callback) {
//    BLElog('urządzenie wyłączone.');
//    return callback(null);
//};
//
//BluetoothController.prototype.turnOnDeviceForExtraVvoter = function (device, callback) {
//    BLElog('dodatkowe urzadzenie włączone.');
//    return callback(null);
//};
//
//BluetoothController.prototype.endSession = function (callback) {
//    BLElog('sesja zakończona.');
//    return callback(null);
//
//};
//
//BluetoothController.prototype.prepareVoting = function (voting, callback) {
//    BLElog('następne głosowanie.');
//    return callback(null);
//
//};
//
//BluetoothController.prototype.startVoting = function (callback) {
//    BLElog('głosowanie rozpoczęte.');
//    return callback(null);
//
//};
//
//BluetoothController.prototype.stopVoting = function (callback) {
//    BLElog('głosowanie zakończone.');
//    return callback(null);
//
//};
//
//BluetoothController.prototype.nextSubquestion = function (callback) {
//    BLElog('następny wariant odpowiedzi.');
//    return callback(null);
//
//};
//
//function BLElog(msg) {
//    console.log('Bluetooth: '+msg);
//}

module.exports = BluetoothController;