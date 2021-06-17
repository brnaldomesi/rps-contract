/**
 * @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
 */

App = {

  web3Provider: null,
  contracts: {},
  registered: false,

  init: function() {

    return App.initWeb3();

  },

  initWeb3: function() {

    // initialising web3
    if (typeof web3 !== 'undefined') {

      App.web3Provider = web3.currentProvider;

    } else {

      // using localhost:7545 - this is the same address as the address that the local blockchain is running on in ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }

    web3 = new Web3(App.web3Provider);

    return App.initContract();

  },

  initContract: function() {

    /*
     * Initialising the contract
     * The json file stores the contract ABI which is passed into the 'RockPaperScissorsArtifact'
     */
    var req = $.getJSON('RockPaperScissors.json', data => {

      var RockPaperScissorsArtifact = data;
      // using TruffleContract
      App.contracts.RockPaperScissors = TruffleContract(RockPaperScissorsArtifact);
      App.contracts.RockPaperScissors.setProvider(App.web3Provider);

    });
    // only call setUp() when the request has terminated
    req.done(() => {
      App.setUp();
    });
  },

  /*
   * Setting up the UI of the web app. This calls getStatus(), which is useful when two players
   * have already registered for the game inside the contract but the page has reloaded (or similar scenarios).
   * The web app will load from the contract state.
   */
  setUp: function() {
    var inst;

    App.contracts.RockPaperScissors.deployed().then(instance => {
      inst = instance;

      getStatus(inst);

    }).catch(err => {
      console.error(err);
    });

  },

  /*
   * This function is called when one of the players registers for the game (by pressing the 'Register' button).
   * It takes in the playerNumber as a parameter, which is detected from the index.html file and this is used to call the
   * 'registerPlayer' function inside the smart contract.
   */
  registerPlayer : function(playerNumber) {
    var inst;
    web3.eth.getAccounts((err, accounts) => {
      if (err) {
        console.error(err);
      }
      var account = accounts[0];
      App.contracts.RockPaperScissors.deployed().then(instance => {
        inst = instance;
        if (playerNumber == 1) {
          // need to send tokens in order for the contract to be able to transfer these at the end of the game.
          return inst.registerPlayer(1, {from: account, value: web3.toWei(5, "ether")});
        }
        else {
          return inst.registerPlayer(2, {from: account, value: web3.toWei(5, "ether")});
        }
      }).then(() => {
        return inst.getAddress(playerNumber);
      }).then(addr => {
        // if successfully registered inside the contract then update the UI accordingly
        setRegistered(playerNumber, addr);
      }).catch(err => {
        console.error(err);
      });
    });
  },

  /*
   * This function is called when a player locks their shape in the web UI. It takes in the
   * player's number from the HTML file and uses this to call the 'lockShape' function
   * inside the smart contract.
   */
  lockShape: function(playerNumber) {
    var inst;
    // get the selected shape and string from the UI
    var shape = getSelectedShape(playerNumber);
    var str = getRandomString(playerNumber);
    web3.eth.getAccounts((err, accounts) => {
      if (err) {
        console.error(err);
      }
      var account = accounts[0];
      App.contracts.RockPaperScissors.deployed().then(instance => {
        inst = instance;
        return inst.lockShape(playerNumber, shape, str, {from: account});
      }).then(() => {
        // if successfully locked inside the contract then update the UI accordingly
        setLocked(playerNumber, inst);
      }).catch(err => {
        console.error(err);
      });
    });
  },

  /*
   * This function is called when a player reveals their shape in the web UI. It takes in the
   * player's number from the HTML file and uses this to call the 'revealShape' function
   * inside the smart contract.
   */
  revealShape: function(playerNumber){
    var inst;
    // get the selected shape and string from the UI
    var shape = getSelectedShape(playerNumber);
    var str = getRandomString(playerNumber);
    web3.eth.getAccounts((err, accounts) => {
      if (err) {
        console.error(err);
      }
      var account = accounts[0];
      App.contracts.RockPaperScissors.deployed().then(instance => {
        inst = instance;
        return inst.revealShape(playerNumber, shape, str, {from: account});
      }).then(() => {
        return inst.getRevealed(playerNumber);
      }).then(string => {
        if (string != "") {
          setRevealed(playerNumber, inst)
        } else {
          // if the reveal was not successful we want to display a message
          if (playerNumber == 1) {
            document.getElementById("status-p1").innerHTML = "Could not reveal player shape.";
          } else if (playerNumber == 2) {
            document.getElementById("status-p2").innerHTML = "Could not reveal player shape.";
          }
        }
      }).catch(err => {
        console.error(err);
      });
    });
  },

  /*
   * This function is called when a player pressed the 'Distribute Rewards' button.
   * This function uses the smart contract to determine who won the game, distribute the rewards, and finally
   * updates the UI.
   */
  distributeRewards: function() {
    var inst;
    web3.eth.getAccounts((err, accounts) => {
      if (err) {
        console.error(err);
      }
      var account = accounts[0];
      App.contracts.RockPaperScissors.deployed().then(instance => {
        inst = instance;
        return inst.distributeRewards({from: account, gas: "1000000"});
      }).then(() => {
        return inst.getWinner();
      }).then(winnerInt => {
        // display a message to notify the players who won the game
        if (winnerInt == 1) {
          document.getElementById("winner-label").innerHTML = "Player1 won the last game.";
        } else if (winnerInt == 2) {
          document.getElementById("winner-label").innerHTML = "Player2 won the last game.";
        } else {
          document.getElementById("winner-label").innerHTML = "The last game was a draw.";
        }
        document.getElementById("register1").disabled = false;
        document.getElementById("register2").disabled = false;
        // after the game has finished we want to reset the game
        App.setUp();
      }).catch(err => {
        console.error(err);
      });
    });
  }
};

/**
 * This function is called to retrieve the selected shape that the player has chosen
 * and returns that shape.
 *
 * @param {int} playerNumber The player's number.
 *
 * @return {string} The player's selected shape.
 *
 */
function getSelectedShape(playerNumber) {
  if (playerNumber == 1) {
    return document.getElementById("select-player1").value;
  } else {
    return document.getElementById("select-player2").value;
  }
}

/**
 * This function is called to retrieve the string that has been typed in by
 * a player for the hashing of their shape.
 *
 * @param {int} playerNumber The player's number.
 *
 * @return {string} The player's string to hash.
 *
 */
function getRandomString(playerNumber) {
  if (playerNumber == 1) {
    return document.getElementById("str1").value;
  } else {
    return document.getElementById("str2").value;
  }
}

/**
 * This function is called when a player selects another shape from the select box in the UI.
 * The image displayed is updated accordingly.
 *
 * @param {string} strShape The shape that has been selected.
 * @param {int} playerNumber The player's number that changed their shape.
 *
 */
function changeImage(strShape, playerNumber) {
  if (playerNumber == 1) {
    document.getElementById("img-player1").src = "/img/" + strShape + ".png";
  } else {
    document.getElementById("img-player2").src = "/img/" + strShape + ".png";
  }
}

/**
 * This function updates the UI to the state that the smart contract is currently in.
 * This is useful for the initial set up of the UI, but particularly for the case
 * when players have already started playing the game and the web page is reloaded -
 * This function allows the web page to be reloaded to the exact state where the players left the game.
 *
 * @param {TruffleContract} inst The TuffleContract instance that is used
 *
 */
function getStatus(inst) {
  document.getElementById("reveal1").disabled = true;
  document.getElementById("reveal2").disabled = true;
  document.getElementById("distribute-rewards").disabled = true;

  // enable all other elements by default
  inst.getAddress(1).then(addr => {
    if (addr == '0x0000000000000000000000000000000000000000' || addr == '0x') {
      setNotRegistered(1);
    } else {
      setRegistered(1, addr);
    }
  });
  inst.getAddress(2).then(addr => {
    if (addr == '0x0000000000000000000000000000000000000000' || addr == '0x') {
      setNotRegistered(2);
    } else {
      setRegistered(2, addr);
    }
  });
  inst.hasLocked(1).then(boolean => {
    if (boolean) {
      setLocked(1, inst);
    }
  });
  inst.hasLocked(2).then(boolean => {
    if (boolean) {
      setLocked(2, inst);
    }
  });
  inst.hasRevealed(1).then(boolean => {
    if (boolean) {
      setRevealed(1, inst);
    }
  });
  inst.hasRevealed(2).then(boolean => {
    if (boolean) {
      setRevealed(2, inst);
    }
  });
}

/**
 * This function updates the UI to the state where the player has not registered yet.
 *
 * @param {int} playerNumber The corresponding player's number - 1 or 2.
 *
 */
function setNotRegistered(playerNumber) {
  if (playerNumber == 1) {
    document.getElementById("select-player1").disabled = true;
    document.getElementById("str1").disabled = true;
    document.getElementById("lock1").disabled = true;
    document.getElementById("status-p1").innerHTML = "Please register.";
    document.getElementById("header-p1").innerHTML = "Player1";
  } else {
    document.getElementById("select-player2").disabled = true;
    document.getElementById("str2").disabled = true;
    document.getElementById("lock2").disabled = true;
    document.getElementById("status-p2").innerHTML = "Please register.";
    document.getElementById("header-p2").innerHTML = "Player2";
  }
}

/**
 * This function updates the UI after a player has registered.
 *
 * @param {int} playerNumber The corresponding player's number - 1 or 2.
 * @param {string} addr The player's address.
 *
 */
function setRegistered(playerNumber, addr) {
  if (playerNumber == 1) {
    document.getElementById("register1").disabled = true;
    document.getElementById("status-p1").innerHTML = "Please lock shape.";
    document.getElementById("header-p1").innerHTML = "Player1: " + addr;
    document.getElementById("select-player1").disabled = false;
    document.getElementById("str1").disabled = false;
    document.getElementById("lock1").disabled = false;
  } else {
    document.getElementById("register2").disabled = true;
    document.getElementById("status-p2").innerHTML = "Please lock shape.";
    document.getElementById("header-p2").innerHTML = "Player2: " + addr;
    document.getElementById("select-player2").disabled = false;
    document.getElementById("str2").disabled = false;
    document.getElementById("lock2").disabled = false;
  }
}

/**
 * This function updates the UI after a player has locked their shape.
 *
 * @param {int} playerNumber The corresponding player's number - 1 or 2.
 * @param {TruffleContract} inst The TuffleContract instance that is used
 *
 */
function setLocked(playerNumber, inst) {
  if (playerNumber == 1) {
    document.getElementById("status-p1").innerHTML = "Successfully locked player shape.";
    document.getElementById("lock1").disabled = true;
    document.getElementById("str1").value = "";
  } else {
    document.getElementById("status-p2").innerHTML = "Successfully locked player shape.";
    document.getElementById("lock2").disabled = true;
    document.getElementById("str2").value = "";
  }
  checkBothLocked(inst);
}

/**
 * This function updates the UI after a player has revealed their shape.
 *
 * @param {int} playerNumber The corresponding player's number - 1 or 2.
 * @param {TruffleContract} inst The TuffleContract instance that is used
 *
 */
function setRevealed(playerNumber, inst) {
  if (playerNumber == 1) {
    document.getElementById("status-p1").innerHTML = "Successfully revealed player shape.";
    document.getElementById("reveal1").disabled = true;
    document.getElementById("str1").value = "";
  } else {
    document.getElementById("status-p2").innerHTML = "Successfully revealed player shape.";
    document.getElementById("reveal2").disabled = true;
    document.getElementById("str2").value = "";
  }
  checkBothRevealed(inst);
}

/**
 * This function checks with the smart contract whether both players have locked their shapes and enables their
 * reveal buttons if so.
 * This is done by calling the hasLocked function inside the contract, which returns a boolean value
 * whether the given player has indeed locked their shape.
 *
 * @param {TruffleContract} inst The TuffleContract instance that is used to call the hasLocked() function
 *
 */
function checkBothLocked(inst) {
  inst.hasLocked(1).then(boolean1 => {
    // only continue checking if player1 has locked their shape
    if (boolean1) {
      return inst.hasLocked(2).then(boolean2 => {
        if (boolean2) {
          // if both have locked then enable the 'Reveal' button for both players
          document.getElementById("reveal1").disabled = false;
          document.getElementById("reveal2").disabled = false;;
        }
      });
    }
  });
}

/**
 * This function checks with the smart contract whether both players have revealed their shapes and enables
 * the 'Distribute Rewards' button if so.
 * This is done by calling the hasRevealed function inside the contract, which returns a boolean value
 * whether the given player has indeed revealed their shape.
 *
 * @param {TruffleContract} inst The TuffleContract instance that is used to call the hasRevealed() function
 *
 */
function checkBothRevealed(inst) {
  inst.hasRevealed(1).then(boolean1 => {
    // only continue checking if player1 has revealed their shape
    if (boolean1) {
      return inst.hasRevealed(2).then(boolean2 => {
        if (boolean2) {
          // if both have revealed then enable the 'Distribute Rewards' button
          document.getElementById("distribute-rewards").disabled = false;
        }
      });
    }
  });
}

/**
* JQuery function that is called when the browser window loads. This initialises the app.
*/
$(() => {
  $(window).load(() => {
    App.init();
  });
});
