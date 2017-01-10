var Web3 = require("web3");
var SolidityEvent = require("web3/lib/web3/event.js");

(function() {
  // Planned for future features, logging, etc.
  function Provider(provider) {
    this.provider = provider;
  }

  Provider.prototype.send = function() {
    this.provider.send.apply(this.provider, arguments);
  };

  Provider.prototype.sendAsync = function() {
    this.provider.sendAsync.apply(this.provider, arguments);
  };

  var BigNumber = (new Web3()).toBigNumber(0).constructor;

  var Utils = {
    is_object: function(val) {
      return typeof val == "object" && !Array.isArray(val);
    },
    is_big_number: function(val) {
      if (typeof val != "object") return false;

      // Instanceof won't work because we have multiple versions of Web3.
      try {
        new BigNumber(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    merge: function() {
      var merged = {};
      var args = Array.prototype.slice.call(arguments);

      for (var i = 0; i < args.length; i++) {
        var object = args[i];
        var keys = Object.keys(object);
        for (var j = 0; j < keys.length; j++) {
          var key = keys[j];
          var value = object[key];
          merged[key] = value;
        }
      }

      return merged;
    },
    promisifyFunction: function(fn, C) {
      var self = this;
      return function() {
        var instance = this;

        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {
          var callback = function(error, result) {
            if (error != null) {
              reject(error);
            } else {
              accept(result);
            }
          };
          args.push(tx_params, callback);
          fn.apply(instance.contract, args);
        });
      };
    },
    synchronizeFunction: function(fn, instance, C) {
      var self = this;
      return function() {
        var args = Array.prototype.slice.call(arguments);
        var tx_params = {};
        var last_arg = args[args.length - 1];

        // It's only tx_params if it's an object and not a BigNumber.
        if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
          tx_params = args.pop();
        }

        tx_params = Utils.merge(C.class_defaults, tx_params);

        return new Promise(function(accept, reject) {

          var decodeLogs = function(logs) {
            return logs.map(function(log) {
              var logABI = C.events[log.topics[0]];

              if (logABI == null) {
                return null;
              }

              var decoder = new SolidityEvent(null, logABI, instance.address);
              return decoder.decode(log);
            }).filter(function(log) {
              return log != null;
            });
          };

          var callback = function(error, tx) {
            if (error != null) {
              reject(error);
              return;
            }

            var timeout = C.synchronization_timeout || 240000;
            var start = new Date().getTime();

            var make_attempt = function() {
              C.web3.eth.getTransactionReceipt(tx, function(err, receipt) {
                if (err) return reject(err);

                if (receipt != null) {
                  // If they've opted into next gen, return more information.
                  if (C.next_gen == true) {
                    return accept({
                      tx: tx,
                      receipt: receipt,
                      logs: decodeLogs(receipt.logs)
                    });
                  } else {
                    return accept(tx);
                  }
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error("Transaction " + tx + " wasn't processed in " + (timeout / 1000) + " seconds!"));
                }

                setTimeout(make_attempt, 1000);
              });
            };

            make_attempt();
          };

          args.push(tx_params, callback);
          fn.apply(self, args);
        });
      };
    }
  };

  function instantiate(instance, contract) {
    instance.contract = contract;
    var constructor = instance.constructor;

    // Provision our functions.
    for (var i = 0; i < instance.abi.length; i++) {
      var item = instance.abi[i];
      if (item.type == "function") {
        if (item.constant == true) {
          instance[item.name] = Utils.promisifyFunction(contract[item.name], constructor);
        } else {
          instance[item.name] = Utils.synchronizeFunction(contract[item.name], instance, constructor);
        }

        instance[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor);
        instance[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor);
        instance[item.name].request = contract[item.name].request;
        instance[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor);
      }

      if (item.type == "event") {
        instance[item.name] = contract[item.name];
      }
    }

    instance.allEvents = contract.allEvents;
    instance.address = contract.address;
    instance.transactionHash = contract.transactionHash;
  };

  // Use inheritance to create a clone of this contract,
  // and copy over contract's static functions.
  function mutate(fn) {
    var temp = function Clone() { return fn.apply(this, arguments); };

    Object.keys(fn).forEach(function(key) {
      temp[key] = fn[key];
    });

    temp.prototype = Object.create(fn.prototype);
    bootstrap(temp);
    return temp;
  };

  function bootstrap(fn) {
    fn.web3 = new Web3();
    fn.class_defaults  = fn.prototype.defaults || {};

    // Set the network iniitally to make default data available and re-use code.
    // Then remove the saved network id so the network will be auto-detected on first use.
    fn.setNetwork("default");
    fn.network_id = null;
    return fn;
  };

  // Accepts a contract object created with web3.eth.contract.
  // Optionally, if called without `new`, accepts a network_id and will
  // create a new version of the contract abstraction with that network_id set.
  function Contract() {
    if (this instanceof Contract) {
      instantiate(this, arguments[0]);
    } else {
      var C = mutate(Contract);
      var network_id = arguments.length > 0 ? arguments[0] : "default";
      C.setNetwork(network_id);
      return C;
    }
  };

  Contract.currentProvider = null;

  Contract.setProvider = function(provider) {
    var wrapped = new Provider(provider);
    this.web3.setProvider(wrapped);
    this.currentProvider = provider;
  };

  Contract.new = function() {
    if (this.currentProvider == null) {
      throw new Error("SmartPoolToken error: Please call setProvider() first before calling new().");
    }

    var args = Array.prototype.slice.call(arguments);

    if (!this.unlinked_binary) {
      throw new Error("SmartPoolToken error: contract binary not set. Can't deploy new instance.");
    }

    var regex = /__[^_]+_+/g;
    var unlinked_libraries = this.binary.match(regex);

    if (unlinked_libraries != null) {
      unlinked_libraries = unlinked_libraries.map(function(name) {
        // Remove underscores
        return name.replace(/_/g, "");
      }).sort().filter(function(name, index, arr) {
        // Remove duplicates
        if (index + 1 >= arr.length) {
          return true;
        }

        return name != arr[index + 1];
      }).join(", ");

      throw new Error("SmartPoolToken contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of SmartPoolToken: " + unlinked_libraries);
    }

    var self = this;

    return new Promise(function(accept, reject) {
      var contract_class = self.web3.eth.contract(self.abi);
      var tx_params = {};
      var last_arg = args[args.length - 1];

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop();
      }

      tx_params = Utils.merge(self.class_defaults, tx_params);

      if (tx_params.data == null) {
        tx_params.data = self.binary;
      }

      // web3 0.9.0 and above calls new twice this callback twice.
      // Why, I have no idea...
      var intermediary = function(err, web3_instance) {
        if (err != null) {
          reject(err);
          return;
        }

        if (err == null && web3_instance != null && web3_instance.address != null) {
          accept(new self(web3_instance));
        }
      };

      args.push(tx_params, intermediary);
      contract_class.new.apply(contract_class, args);
    });
  };

  Contract.at = function(address) {
    if (address == null || typeof address != "string" || address.length != 42) {
      throw new Error("Invalid address passed to SmartPoolToken.at(): " + address);
    }

    var contract_class = this.web3.eth.contract(this.abi);
    var contract = contract_class.at(address);

    return new this(contract);
  };

  Contract.deployed = function() {
    if (!this.address) {
      throw new Error("Cannot find deployed address: SmartPoolToken not deployed or address not set.");
    }

    return this.at(this.address);
  };

  Contract.defaults = function(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {};
    }

    if (class_defaults == null) {
      class_defaults = {};
    }

    var self = this;
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key];
      self.class_defaults[key] = value;
    });

    return this.class_defaults;
  };

  Contract.extend = function() {
    var args = Array.prototype.slice.call(arguments);

    for (var i = 0; i < arguments.length; i++) {
      var object = arguments[i];
      var keys = Object.keys(object);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        var value = object[key];
        this.prototype[key] = value;
      }
    }
  };

  Contract.all_networks = {
  "2": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_spender",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "name": "supply",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_from",
            "type": "address"
          },
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "tokenRate",
        "outputs": [
          {
            "name": "tokenRate",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "donors",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "stopAcceptingDonation",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getDonationAmount",
        "outputs": [
          {
            "name": "donation",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_owner",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "balance",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newRate",
            "type": "uint256"
          }
        ],
        "name": "changeRate",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getTokenBalance",
        "outputs": [
          {
            "name": "tokens",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalFundRaised",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "donationAmountInWei",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "donorCount",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_owner",
            "type": "address"
          },
          {
            "name": "_spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "name": "remaining",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "startAcceptingDonation",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "preminedTokens",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "constructor"
      },
      {
        "payable": true,
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "newTokenHolder",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "tokensAmount",
            "type": "uint256"
          }
        ],
        "name": "TokenMint",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "tokensAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "blockNumber",
            "type": "uint256"
          }
        ],
        "name": "Donated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x60a0604052600960608190527f536d617274506f6f6c000000000000000000000000000000000000000000000060809081526004805460008290527f536d617274506f6f6c0000000000000000000000000000000000000000000012825590927f8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b602060026001851615610100026000190190941693909304601f0192909204820192909190620000db565b82800160010185558215620000db579182015b82811115620000db578251825591602001919060010190620000be565b5b50620000ff9291505b80821115620000fb5760008155600101620000e5565b5090565b50506040805180820190915260038082527f535054000000000000000000000000000000000000000000000000000000000060209283019081526005805460008290528251600660ff1990911617825590937f036b6384b5eca791c62761152d0c79bb0604c104a5fb6f4eb0703f3154bb3db060026001841615610100026000190190931692909204601f010481019291620001c6565b82800160010185558215620001c6579182015b82811115620001c6578251825591602001919060010190620001a9565b5b50620001ea9291505b80821115620000fb5760008155600101620000e5565b5090565b50506000600655670de0b6b3a7640000600d553462000000576040516020806200116583398101604052515b5b5b60038054600160a060020a03191633600160a060020a03161790555b6003805460a060020a60ff02191690555b6000600b8190556064600c819055600a91909155600354600d54620002a192600160a060020a03909216916200028d918591900464010000000062000cb0620002aa82021704565b6401000000006200063f620002e882021704565b505b5062000434565b6000828202620002dd841580620002c957508385838115620000005704145b64010000000062000ca0620003e982021704565b8091505b5092915050565b60006000600d5462000311600c5485620002aa6401000000000262000cb0176401000000009004565b8115620000005704905060018110620003dd57600160a060020a03841660009081526001602052604090205462000357908264010000000062000617620003fb82021704565b600160a060020a038516600090815260016020526040902055600b546200038d908264010000000062000617620003fb82021704565b600b5560408051600160a060020a03861681526020810183905281517f36bf5aa3964be01dbd95a0154a8930793fe68353bdc580871ffb2c911366bbc7929181900390910190a1809150620002e1565b600091505b5092915050565b801515620003f75762000000565b5b50565b6000828201620002dd848210801590620002c95750838210155b64010000000062000ca0620003e982021704565b8091505b5092915050565b610d2180620004446000396000f3006060604052361561010c5763ffffffff60e060020a60003504166306fdde038114610246578063095ea7b3146102d357806318160ddd1461030357806323b872dd14610322578063313ce5671461035857806331711884146103775780633ccfd60b146103965780634abfa163146103a5578063519a73c3146103d157806359be7e99146103e057806370a08231146103ff57806374e7493b1461042a57806382b2e2571461044e5780638da5cb5b1461046d5780639030e40f1461049657806395d89b41146104b5578063a9059cbb14610542578063ad53322b14610572578063c407670f1461059d578063dd62ed3e146105bc578063e67e04f9146105ed578063f2fde38b146105fc575b6102445b600354600090819060a060020a900460ff161561012c57610000565b3491506000821161013c57610000565b600160a060020a033316600090815260076020526040902054151561019b57600980546000908152600860205260409020805473ffffffffffffffffffffffffffffffffffffffff191633600160a060020a0316179055805460010190555b600160a060020a0333166000908152600760205260409020546101be9083610617565b600160a060020a033316600090815260076020526040902055600a546101e49083610617565b600a556101f1338361063f565b604080518481526020810183905243818301529051919250600160a060020a033316917f8d09c6745838fd32e92a7aec9e4c21f8fcc0ddf4300881dcffdbf060ba8bcff29181900360600190a25b5b5050565b005b3461000057610253610707565b604080516020808252835181830152835191928392908301918501908083838215610299575b80518252602083111561029957601f199092019160209182019101610279565b505050905090810190601f1680156102c55780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34610000576102ef600160a060020a0360043516602435610795565b604080519115158252519081900360200190f35b3461000057610310610800565b60408051918252519081900360200190f35b34610000576102ef600160a060020a0360043581169060243516604435610807565b604080519115158252519081900360200190f35b346100005761031061090a565b60408051918252519081900360200190f35b3461000057610310610910565b60408051918252519081900360200190f35b3461000057610244610917565b005b34610000576103b5600435610968565b60408051600160a060020a039092168252519081900360200190f35b3461000057610244610983565b005b34610000576103106109da565b60408051918252519081900360200190f35b3461000057610310600160a060020a03600435166109f7565b60408051918252519081900360200190f35b34610000576102ef600435610a16565b604080519115158252519081900360200190f35b3461000057610310610a40565b60408051918252519081900360200190f35b34610000576103b5610a5d565b60408051600160a060020a039092168252519081900360200190f35b3461000057610310610a6c565b60408051918252519081900360200190f35b3461000057610253610a72565b604080516020808252835181830152835191928392908301918501908083838215610299575b80518252602083111561029957601f199092019160209182019101610279565b505050905090810190601f1680156102c55780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34610000576102ef600160a060020a0360043516602435610b00565b604080519115158252519081900360200190f35b3461000057610310600160a060020a0360043516610bb4565b60408051918252519081900360200190f35b3461000057610310610bc6565b60408051918252519081900360200190f35b3461000057610310600160a060020a0360043581169060243516610bcc565b60408051918252519081900360200190f35b3461000057610244610bf9565b005b3461000057610244600160a060020a0360043516610c4b565b005b600082820161063484821080159061062f5750838210155b610ca0565b8091505b5092915050565b60006000600d54610652600c5485610cb0565b811561000057049050600181106106fb57600160a060020a0384166000908152600160205260409020546106869082610617565b600160a060020a038516600090815260016020526040902055600b546106ac9082610617565b600b5560408051600160a060020a03861681526020810183905281517f36bf5aa3964be01dbd95a0154a8930793fe68353bdc580871ffb2c911366bbc7929181900390910190a1809150610638565b600091505b5092915050565b6004805460408051602060026001851615610100026000190190941693909304601f8101849004840282018401909252818152929183018282801561078d5780601f106107625761010080835404028352916020019161078d565b820191906000526020600020905b81548152906001019060200180831161077057829003601f168201915b505050505081565b600160a060020a03338116600081815260026020908152604080832094871680845294825280832086905580518681529051929493927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925929181900390910190a35060015b92915050565b600b545b90565b600160a060020a0380841660009081526002602090815260408083203385168452825280832054938616835260019091528120549091906108489084610617565b600160a060020a0380861660009081526001602052604080822093909355908716815220546108779084610cdc565b600160a060020a03861660009081526001602052604090205561089a8184610cdc565b600160a060020a038087166000818152600260209081526040808320338616845282529182902094909455805187815290519288169391927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929181900390910190a3600191505b509392505050565b60065481565b600c545b90565b60035433600160a060020a039081169116141561096357600354604051600160a060020a039182169130163180156108fc02916000818181858888f19350505050151561096357610000565b5b5b5b565b600860205260009081526040902054600160a060020a031681565b60035433600160a060020a03908116911614156109635760035460a060020a900460ff16156109b157610000565b6003805474ff0000000000000000000000000000000000000000191660a060020a1790555b5b5b565b600160a060020a0333166000908152600760205260409020545b90565b600160a060020a0381166000908152600160205260409020545b919050565b60035460009033600160a060020a0390811691161415610a115750600c81905560015b5b5b919050565b600160a060020a0333166000908152600160205260409020545b90565b600354600160a060020a031681565b600a5481565b6005805460408051602060026001851615610100026000190190941693909304601f8101849004840282018401909252818152929183018282801561078d5780601f106107625761010080835404028352916020019161078d565b820191906000526020600020905b81548152906001019060200180831161077057829003601f168201915b505050505081565b600160a060020a033316600090815260016020526040812054610b239083610cdc565b600160a060020a033381166000908152600160205260408082209390935590851681522054610b529083610617565b600160a060020a038085166000818152600160209081526040918290209490945580518681529051919333909316927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a35060015b92915050565b60076020526000908152604090205481565b60095481565b600160a060020a038083166000908152600260209081526040808320938516835292905220545b92915050565b60035433600160a060020a03908116911614156109635760035460a060020a900460ff161515610c2857610000565b6003805474ff0000000000000000000000000000000000000000191690555b5b5b565b60035433600160a060020a0390811691161415610c9a57600160a060020a03811615610c9a576003805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a0383161790555b5b5b5b50565b801515610c9a57610000565b5b50565b600082820261063484158061062f575083858381156100005704145b610ca0565b8091505b5092915050565b6000610cea83831115610ca0565b508082035b929150505600a165627a7a72305820a8891e79cb405e35619df2822b432b5f868b341970116021d217d1153da7f8ef0029",
    "events": {
      "0x36bf5aa3964be01dbd95a0154a8930793fe68353bdc580871ffb2c911366bbc7": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "newTokenHolder",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "tokensAmount",
            "type": "uint256"
          }
        ],
        "name": "TokenMint",
        "type": "event"
      },
      "0x8d09c6745838fd32e92a7aec9e4c21f8fcc0ddf4300881dcffdbf060ba8bcff2": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "tokensAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "blockNumber",
            "type": "uint256"
          }
        ],
        "name": "Donated",
        "type": "event"
      },
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      }
    },
    "updated_at": 1484051267736,
    "links": {},
    "address": "0x8c0b17880c4a3c7d8be55339713144b52e61f388"
  },
  "default": {
    "abi": [
      {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_spender",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "name": "supply",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_from",
            "type": "address"
          },
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "tokenRate",
        "outputs": [
          {
            "name": "tokenRate",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "withdraw",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "donors",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "stopAcceptingDonation",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getDonationAmount",
        "outputs": [
          {
            "name": "donation",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_owner",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "name": "balance",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newRate",
            "type": "uint256"
          }
        ],
        "name": "changeRate",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "getTokenBalance",
        "outputs": [
          {
            "name": "tokens",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "totalFundRaised",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "_to",
            "type": "address"
          },
          {
            "name": "_value",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "name": "success",
            "type": "bool"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "",
            "type": "address"
          }
        ],
        "name": "donationAmountInWei",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [],
        "name": "donorCount",
        "outputs": [
          {
            "name": "",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": true,
        "inputs": [
          {
            "name": "_owner",
            "type": "address"
          },
          {
            "name": "_spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "name": "remaining",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [],
        "name": "startAcceptingDonation",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "name": "newOwner",
            "type": "address"
          }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "payable": false,
        "type": "function"
      },
      {
        "inputs": [
          {
            "name": "preminedTokens",
            "type": "uint256"
          }
        ],
        "payable": false,
        "type": "constructor"
      },
      {
        "payable": true,
        "type": "fallback"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "newTokenHolder",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "tokensAmount",
            "type": "uint256"
          }
        ],
        "name": "TokenMint",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "tokensAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "blockNumber",
            "type": "uint256"
          }
        ],
        "name": "Donated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      }
    ],
    "unlinked_binary": "0x60a0604052600960608190527f536d617274506f6f6c000000000000000000000000000000000000000000000060809081526004805460008290527f536d617274506f6f6c0000000000000000000000000000000000000000000012825590927f8a35acfbc15ff81a39ae7d344fd709f28e8600b4aa8c65c6b64bfe7fe36bd19b602060026001851615610100026000190190941693909304601f0192909204820192909190620000db565b82800160010185558215620000db579182015b82811115620000db578251825591602001919060010190620000be565b5b50620000ff9291505b80821115620000fb5760008155600101620000e5565b5090565b50506040805180820190915260038082527f535054000000000000000000000000000000000000000000000000000000000060209283019081526005805460008290528251600660ff1990911617825590937f036b6384b5eca791c62761152d0c79bb0604c104a5fb6f4eb0703f3154bb3db060026001841615610100026000190190931692909204601f010481019291620001c6565b82800160010185558215620001c6579182015b82811115620001c6578251825591602001919060010190620001a9565b5b50620001ea9291505b80821115620000fb5760008155600101620000e5565b5090565b50506001600655670de0b6b3a7640000600d553462000000576040516020806200116583398101604052515b5b5b60038054600160a060020a03191633600160a060020a03161790555b6003805460a060020a60ff02191690555b6000600b8190556064600c819055600a91909155600354600d54620002a192600160a060020a03909216916200028d918591900464010000000062000cb0620002aa82021704565b6401000000006200063f620002e882021704565b505b5062000434565b6000828202620002dd841580620002c957508385838115620000005704145b64010000000062000ca0620003e982021704565b8091505b5092915050565b60006000600d5462000311600c5485620002aa6401000000000262000cb0176401000000009004565b8115620000005704905060018110620003dd57600160a060020a03841660009081526001602052604090205462000357908264010000000062000617620003fb82021704565b600160a060020a038516600090815260016020526040902055600b546200038d908264010000000062000617620003fb82021704565b600b5560408051600160a060020a03861681526020810183905281517f36bf5aa3964be01dbd95a0154a8930793fe68353bdc580871ffb2c911366bbc7929181900390910190a1809150620002e1565b600091505b5092915050565b801515620003f75762000000565b5b50565b6000828201620002dd848210801590620002c95750838210155b64010000000062000ca0620003e982021704565b8091505b5092915050565b610d2180620004446000396000f3006060604052361561010c5763ffffffff60e060020a60003504166306fdde038114610246578063095ea7b3146102d357806318160ddd1461030357806323b872dd14610322578063313ce5671461035857806331711884146103775780633ccfd60b146103965780634abfa163146103a5578063519a73c3146103d157806359be7e99146103e057806370a08231146103ff57806374e7493b1461042a57806382b2e2571461044e5780638da5cb5b1461046d5780639030e40f1461049657806395d89b41146104b5578063a9059cbb14610542578063ad53322b14610572578063c407670f1461059d578063dd62ed3e146105bc578063e67e04f9146105ed578063f2fde38b146105fc575b6102445b600354600090819060a060020a900460ff161561012c57610000565b3491506000821161013c57610000565b600160a060020a033316600090815260076020526040902054151561019b57600980546000908152600860205260409020805473ffffffffffffffffffffffffffffffffffffffff191633600160a060020a0316179055805460010190555b600160a060020a0333166000908152600760205260409020546101be9083610617565b600160a060020a033316600090815260076020526040902055600a546101e49083610617565b600a556101f1338361063f565b604080518481526020810183905243818301529051919250600160a060020a033316917f8d09c6745838fd32e92a7aec9e4c21f8fcc0ddf4300881dcffdbf060ba8bcff29181900360600190a25b5b5050565b005b3461000057610253610707565b604080516020808252835181830152835191928392908301918501908083838215610299575b80518252602083111561029957601f199092019160209182019101610279565b505050905090810190601f1680156102c55780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34610000576102ef600160a060020a0360043516602435610795565b604080519115158252519081900360200190f35b3461000057610310610800565b60408051918252519081900360200190f35b34610000576102ef600160a060020a0360043581169060243516604435610807565b604080519115158252519081900360200190f35b346100005761031061090a565b60408051918252519081900360200190f35b3461000057610310610910565b60408051918252519081900360200190f35b3461000057610244610917565b005b34610000576103b5600435610968565b60408051600160a060020a039092168252519081900360200190f35b3461000057610244610983565b005b34610000576103106109da565b60408051918252519081900360200190f35b3461000057610310600160a060020a03600435166109f7565b60408051918252519081900360200190f35b34610000576102ef600435610a16565b604080519115158252519081900360200190f35b3461000057610310610a40565b60408051918252519081900360200190f35b34610000576103b5610a5d565b60408051600160a060020a039092168252519081900360200190f35b3461000057610310610a6c565b60408051918252519081900360200190f35b3461000057610253610a72565b604080516020808252835181830152835191928392908301918501908083838215610299575b80518252602083111561029957601f199092019160209182019101610279565b505050905090810190601f1680156102c55780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34610000576102ef600160a060020a0360043516602435610b00565b604080519115158252519081900360200190f35b3461000057610310600160a060020a0360043516610bb4565b60408051918252519081900360200190f35b3461000057610310610bc6565b60408051918252519081900360200190f35b3461000057610310600160a060020a0360043581169060243516610bcc565b60408051918252519081900360200190f35b3461000057610244610bf9565b005b3461000057610244600160a060020a0360043516610c4b565b005b600082820161063484821080159061062f5750838210155b610ca0565b8091505b5092915050565b60006000600d54610652600c5485610cb0565b811561000057049050600181106106fb57600160a060020a0384166000908152600160205260409020546106869082610617565b600160a060020a038516600090815260016020526040902055600b546106ac9082610617565b600b5560408051600160a060020a03861681526020810183905281517f36bf5aa3964be01dbd95a0154a8930793fe68353bdc580871ffb2c911366bbc7929181900390910190a1809150610638565b600091505b5092915050565b6004805460408051602060026001851615610100026000190190941693909304601f8101849004840282018401909252818152929183018282801561078d5780601f106107625761010080835404028352916020019161078d565b820191906000526020600020905b81548152906001019060200180831161077057829003601f168201915b505050505081565b600160a060020a03338116600081815260026020908152604080832094871680845294825280832086905580518681529051929493927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925929181900390910190a35060015b92915050565b600b545b90565b600160a060020a0380841660009081526002602090815260408083203385168452825280832054938616835260019091528120549091906108489084610617565b600160a060020a0380861660009081526001602052604080822093909355908716815220546108779084610cdc565b600160a060020a03861660009081526001602052604090205561089a8184610cdc565b600160a060020a038087166000818152600260209081526040808320338616845282529182902094909455805187815290519288169391927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929181900390910190a3600191505b509392505050565b60065481565b600c545b90565b60035433600160a060020a039081169116141561096357600354604051600160a060020a039182169130163180156108fc02916000818181858888f19350505050151561096357610000565b5b5b5b565b600860205260009081526040902054600160a060020a031681565b60035433600160a060020a03908116911614156109635760035460a060020a900460ff16156109b157610000565b6003805474ff0000000000000000000000000000000000000000191660a060020a1790555b5b5b565b600160a060020a0333166000908152600760205260409020545b90565b600160a060020a0381166000908152600160205260409020545b919050565b60035460009033600160a060020a0390811691161415610a115750600c81905560015b5b5b919050565b600160a060020a0333166000908152600160205260409020545b90565b600354600160a060020a031681565b600a5481565b6005805460408051602060026001851615610100026000190190941693909304601f8101849004840282018401909252818152929183018282801561078d5780601f106107625761010080835404028352916020019161078d565b820191906000526020600020905b81548152906001019060200180831161077057829003601f168201915b505050505081565b600160a060020a033316600090815260016020526040812054610b239083610cdc565b600160a060020a033381166000908152600160205260408082209390935590851681522054610b529083610617565b600160a060020a038085166000818152600160209081526040918290209490945580518681529051919333909316927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef92918290030190a35060015b92915050565b60076020526000908152604090205481565b60095481565b600160a060020a038083166000908152600260209081526040808320938516835292905220545b92915050565b60035433600160a060020a03908116911614156109635760035460a060020a900460ff161515610c2857610000565b6003805474ff0000000000000000000000000000000000000000191690555b5b5b565b60035433600160a060020a0390811691161415610c9a57600160a060020a03811615610c9a576003805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a0383161790555b5b5b5b50565b801515610c9a57610000565b5b50565b600082820261063484158061062f575083858381156100005704145b610ca0565b8091505b5092915050565b6000610cea83831115610ca0565b508082035b929150505600a165627a7a723058203898544f7c20868b0fde51c4ef132dd476178979532bccd09598b49250b2c7160029",
    "events": {
      "0x36bf5aa3964be01dbd95a0154a8930793fe68353bdc580871ffb2c911366bbc7": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "newTokenHolder",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "tokensAmount",
            "type": "uint256"
          }
        ],
        "name": "TokenMint",
        "type": "event"
      },
      "0x8d09c6745838fd32e92a7aec9e4c21f8fcc0ddf4300881dcffdbf060ba8bcff2": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "tokensAmount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "name": "blockNumber",
            "type": "uint256"
          }
        ],
        "name": "Donated",
        "type": "event"
      },
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925": {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      }
    },
    "updated_at": 1484037908736
  }
};

  Contract.checkNetwork = function(callback) {
    var self = this;

    if (this.network_id != null) {
      return callback();
    }

    this.web3.version.network(function(err, result) {
      if (err) return callback(err);

      var network_id = result.toString();

      // If we have the main network,
      if (network_id == "1") {
        var possible_ids = ["1", "live", "default"];

        for (var i = 0; i < possible_ids.length; i++) {
          var id = possible_ids[i];
          if (Contract.all_networks[id] != null) {
            network_id = id;
            break;
          }
        }
      }

      if (self.all_networks[network_id] == null) {
        return callback(new Error(self.name + " error: Can't find artifacts for network id '" + network_id + "'"));
      }

      self.setNetwork(network_id);
      callback();
    })
  };

  Contract.setNetwork = function(network_id) {
    var network = this.all_networks[network_id] || {};

    this.abi             = this.prototype.abi             = network.abi;
    this.unlinked_binary = this.prototype.unlinked_binary = network.unlinked_binary;
    this.address         = this.prototype.address         = network.address;
    this.updated_at      = this.prototype.updated_at      = network.updated_at;
    this.links           = this.prototype.links           = network.links || {};
    this.events          = this.prototype.events          = network.events || {};

    this.network_id = network_id;
  };

  Contract.networks = function() {
    return Object.keys(this.all_networks);
  };

  Contract.link = function(name, address) {
    if (typeof name == "function") {
      var contract = name;

      if (contract.address == null) {
        throw new Error("Cannot link contract without an address.");
      }

      Contract.link(contract.contract_name, contract.address);

      // Merge events so this contract knows about library's events
      Object.keys(contract.events).forEach(function(topic) {
        Contract.events[topic] = contract.events[topic];
      });

      return;
    }

    if (typeof name == "object") {
      var obj = name;
      Object.keys(obj).forEach(function(name) {
        var a = obj[name];
        Contract.link(name, a);
      });
      return;
    }

    Contract.links[name] = address;
  };

  Contract.contract_name   = Contract.prototype.contract_name   = "SmartPoolToken";
  Contract.generated_with  = Contract.prototype.generated_with  = "3.2.0";

  // Allow people to opt-in to breaking changes now.
  Contract.next_gen = false;

  var properties = {
    binary: function() {
      var binary = Contract.unlinked_binary;

      Object.keys(Contract.links).forEach(function(library_name) {
        var library_address = Contract.links[library_name];
        var regex = new RegExp("__" + library_name + "_*", "g");

        binary = binary.replace(regex, library_address.replace("0x", ""));
      });

      return binary;
    }
  };

  Object.keys(properties).forEach(function(key) {
    var getter = properties[key];

    var definition = {};
    definition.enumerable = true;
    definition.configurable = false;
    definition.get = getter;

    Object.defineProperty(Contract, key, definition);
    Object.defineProperty(Contract.prototype, key, definition);
  });

  bootstrap(Contract);

  if (typeof module != "undefined" && typeof module.exports != "undefined") {
    module.exports = Contract;
  } else {
    // There will only be one version of this contract in the browser,
    // and we can use that.
    window.SmartPoolToken = Contract;
  }
})();
