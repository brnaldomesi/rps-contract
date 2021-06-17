pragma solidity ^0.5.0;

/**
* @title RockPaperScissors
* @author Noah-Vincenz Noeh <noah-vincenz.noeh18@imperial.ac.uk>
* @notice This smart contract allows two players to play Rock Paper Scissors against each other and the winner gets some Ether as reward.
*/
contract RockPaperScissors {
  address payable player1;
  address payable player2;
  bytes32 hash1;
  bytes32 hash2;
  string revealedP1Shape;
  string revealedP2Shape;
  int lastWinner;

  modifier notRegisteredYet() {
    require(msg.sender != player1 && msg.sender != player2);
    _;
  }

  modifier isRegistered() {
    require(msg.sender == player1 || msg.sender == player2);
    _;
  }

  modifier hasEnoughEther() {
    require(msg.value >= 5 ether);
    _;
  }

  modifier bothLocked(){
    require(hash1 != bytes32(0) && hash2 != bytes32(0));
    _;
  }

  modifier bothRevealed(){
    require(!stringsEqual(revealedP1Shape, "") && !stringsEqual(revealedP2Shape, ""));
    _;
  }

  // this is to make sure that a registered player cannot lock / reveal another player's shape
  modifier correctPlayer(int playerNumber) {
    require((msg.sender == player1 && playerNumber == 1) || (msg.sender == player2 && playerNumber == 2));
    _;
  }

  /**
  * @notice This function returns a boolean whether the corresponding player has locked their shape.
  * @param playerNumber The player's number (either 1 or 2).
  * @return true or false.
  */
  function hasLocked(int playerNumber) public view returns (bool) {
    if (playerNumber == 1)
      return (hash1 != bytes32(0));
    else
      return (hash2 != bytes32(0));
  }

  /**
  * @notice This function returns a boolean whether the corresponding player has revealed their shape.
  * @param playerNumber The player's number (either 1 or 2).
  * @return true or false.
  */
  function hasRevealed(int playerNumber) public view returns (bool) {
    if (playerNumber == 1)
      return (!stringsEqual(revealedP1Shape, ""));
    else
      return (!stringsEqual(revealedP2Shape, ""));
  }

  /**
  * @notice This function returns the corresponding player's address.
  * @param playerNumber The player's number (either 1 or 2).
  * @return The player's address.
  */
  function getAddress(int playerNumber) public view returns (address) {
    if (playerNumber == 1)
      return player1;
    else
      return player2;
  }

  /**
  * @notice This function returns the corresponding player's revealed string.
  * @param playerNumber The player's number (either 1 or 2).
  * @return The player's revealed string - "Rock", "Paper" or "Scissors".
  */
  function getRevealed(int playerNumber) public view returns (string memory) {
    if (playerNumber == 1)
      return revealedP1Shape;
    else
      return revealedP2Shape;
  }

  /**
  * @notice This function returns the corresponding player's hash.
  * @param playerNumber The player's number (either 1 or 2).
  * @return The player's hash.
  */
  function getHash(int playerNumber) public view returns (bytes32) {
    if (playerNumber == 1)
      return hash1;
    else
      return hash2;
  }

  /**
  * @notice This function returns the winner of the last game.
  * @return The player's numbe - either 1 or 2 (or 0 if it was a draw).
  */
  function getWinner() public view returns (int) {
    return lastWinner;
  }

  /**
  * @notice This function is called to reset the contract's variable states for a new game.
  */
  function resetVariables() public {
    revealedP1Shape = "";
    revealedP2Shape = "";
    player1 = address(0);
    player2 = address(0);
		hash1 = bytes32(0);
		hash2 = bytes32(0);
  }

  /**
  * @notice This function registers a player address to the game.
  * @param playerNumber The player's number (either 1 or 2).
  */
  function registerPlayer(int playerNumber) public payable notRegisteredYet hasEnoughEther {

    if (playerNumber == 1) {
      if (player1 == address(0)) {
          player1 = msg.sender;
        }
    } else {
      if (player2 == address(0)) {
          player2 = msg.sender;
      }
    }
  }

  /**
  * @notice This function locks a player's shape by creating a hash of the passed in shape and string XORed.
  * @param playerNumber The player's number (either 1 or 2).
  * @param shape The player's selected shape ("Rock", "Paper" or "Scissors").
  * @param randomStringToHash The player's selected random string to hash the shape with.
  */
  function lockShape(int playerNumber, string memory shape, string memory randomStringToHash) public correctPlayer(playerNumber) isRegistered {
    // if the player is locking his own shape AND if it is the player's address that calls this AND if the player's hash has not been set
    if(msg.sender == player1 && hash1 == bytes32(0)) {
      // XOR random string with shape
      hash1 = keccak256(bytes(shape)) ^ keccak256(bytes(randomStringToHash));
    }
    if(msg.sender == player2 && hash2 == bytes32(0)) {
      hash2 = keccak256(bytes(shape)) ^ keccak256(bytes(randomStringToHash));
    }
  }

  /**
  * @notice This function reveals a player's shape. This checks whether the stored hash equals the new given hash (consisting of the currently selected shape and string)
  * @param playerNumber The player's number (either 1 or 2).
  * @param shape The player's selected shape ("Rock", "Paper" or "Scissors").
  * @param randomStringToHash The player's selected random string to hash the shape with.
  */
  function revealShape(int playerNumber, string memory shape, string memory randomStringToHash) public isRegistered bothLocked correctPlayer(playerNumber) {
    bytes32 tempHash = keccak256(bytes(shape)) ^ keccak256(bytes(randomStringToHash));

		if(msg.sender == player1){
			if(tempHash == hash1){
				if(stringsEqual(shape, "Rock")) {
					revealedP1Shape = "Rock";
				}
        if(stringsEqual(shape, "Paper")) {
          revealedP1Shape = "Paper";
				}
        if(stringsEqual(shape, "Scissors")) {
          revealedP1Shape = "Scissors";
				}
        // shape is going to be one of the above
			}
		}
    if(msg.sender == player2){
			if(tempHash == hash2){
				if(stringsEqual(shape, "Rock")) {
					revealedP2Shape = "Rock";
				}
        if(stringsEqual(shape, "Paper")) {
          revealedP2Shape = "Paper";
				}
        if(stringsEqual(shape, "Scissors")) {
          revealedP2Shape = "Scissors";
				}
			}
		}
	}

  /**
  * @notice This function computes the winner shape from two shapes and returns 1 if player 1 wins, 2 if player 2 wins and 0 if it is a draw.
  * @param revealedP1 Player 1's revealed shape.
  * @param revealedP2 Player 2's revealed shape.
  * @return 1, 2 or 0 depending on which player won the game (0 in the case of a draw).
  */
  function computeWinner(string memory revealedP1, string memory revealedP2) pure public returns (int) {

    if (stringsEqual(revealedP1, revealedP2)) return 0;
    else if (stringsEqual(revealedP1, "Rock") && stringsEqual(revealedP2, "Scissors")) return 1;
    else if (stringsEqual(revealedP1, "Rock") && stringsEqual(revealedP2, "Paper")) return 2;
    else if (stringsEqual(revealedP1, "Paper") && stringsEqual(revealedP2, "Rock")) return 1;
    else if (stringsEqual(revealedP1, "Paper") && stringsEqual(revealedP2, "Scissors")) return 2;
    else if (stringsEqual(revealedP1, "Scissors") && stringsEqual(revealedP2, "Rock")) return 2;
    else if (stringsEqual(revealedP1, "Scissors") && stringsEqual(revealedP2, "Paper")) return 1;
    else return 0;

  }

  /**
  * @notice This function is called when both players have locked and revealed their shapes and the 'Distribute Rewards' button in the UI is pressed.
  */
  function distributeRewards() public payable bothLocked bothRevealed isRegistered {

    int winner = computeWinner(revealedP1Shape, revealedP2Shape);

    if (winner == 1) {

      player1.transfer(10 ether);

    } else if (winner == 2) {

      player2.transfer(10 ether);

    } else {
      // in the case of a draw, send half money to both parties
      player1.transfer(5 ether);
			player2.transfer(5 ether);

    }
    lastWinner = winner;
    resetVariables();

  }

  /**
  * @notice This function compares two strings (memory) and checks whether these are equal and returns the corresponding boolean.
  * @param stringA First string to compare with.
  * @param stringB Second string to compare with.
  * @return true or false depending on whether the two strings are equal.
  */
  function stringsEqual(string memory stringA, string memory stringB) public pure returns (bool) {
    bytes memory a = bytes(stringA);
    bytes memory b = bytes(stringB);

    if (a.length != b.length)
        return false;

    for (uint i = 0; i < a.length; i ++)
        if (a[i] != b[i])
            return false;
        return true;
  }

}
