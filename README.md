# RockPaperScissors

## Description

Rock Paper Scissors is a hand game usually played between two people, in which each player simultaneously forms one of three shapes with an outstretched hand. The shapes that players can form are Rock (a closed fist), Paper (a flat hand), and Scissors (a fist with the index finger and middle finger extended, forming a V). This is a simultaneous, zero- sum game, which only has two possible outcomes: a win for one player and a loss for the other, or a draw (see: [Wikipedia](https://en.wikipedia.org/wiki/Rock–paper–scissors)). The outcome of the game is determined by the shapes that the players have chosen:

- Rock beats Scissors 
- Paper beats Rock
- Scissors beats Paper

If two players have chosen the same shape then there will be a draw.


## Implementation

This project entails an Ethereum smart contract based implementation of the game and hence represents a decentralised version of the classical game. Rock Paper Scissors is often used as a fair choosing method between two people, similar to coin flipping, however, Rock Paper Scissors is said not to be truly random. Usually, players agree to form (and reveal) their shapes facing each other at the same time. This leads us to the asynchronous nature of play of the game: The two players will never reveal their shapes at exactly the same moment in time and hence, one player (the slower player) will always have a slight advantage. In the classical version of the game, where the two players are fair players facing each other and revealing their shapes at roughly the same time, this time difference is minimal. However, if the game is implemented in a different way, this represents an issue. The solution to this problem for this project is the following: The party who announces first, announces not the value but a commitment to that very value. This commitment needs to be binding and concealing. In this application, this can be realised by using a hash function that both players agree on, which is used to hash the player shape. The different stages of the game protocol are now as follows:

- A commits to a shape and the commitment is a hash value hA
- B commits to a shape and the commitment is a hash value hB
- A reveals their shape iff A knows that B has committed to their shape with hB
- B reveals their shape iff B knows that A has committed to their shape with hA 
- The revealed shapes determine the winner of the game

The winner of the game is rewarded with a financial reward of 10 ether. In the case of a draw, both players receive 5 ether each.

## Architectural Choice

![untitled diagram-9 18 11 30](https://user-images.githubusercontent.com/16804823/52737891-586b4a80-2fc5-11e9-9ad8-2ada031897e3.jpg)

For this project an HTML/JavaScript web application was designed, which directly interacts with Web3.js and a Truffle contract instance created from the smart contract written in Solidity. The Web3.js and TruffleContract build the communication bridge between the web application and the Ethereum blockchain.

## Application Walkthrough

### Installation & Setup

Run your local blockchain using ganache (see: [Truffleframework](https://truffleframework.com/ganache) ) . 
Cd into the root directory of the project and run the following commands:

```
./node_modules/.bin/truffle compile
./node_modules/.bin/truffle migrate --reset
npm run dev
```

The web application will load in your browser and the game is ready to be played.

### Gameplay

* Register as Player1 by pressing ‘Register’ — this will trigger a transaction charging the registering address 5 ether
* Register a second player by changing to another address in Metamask and registering this player as Player2 (Player2 is also charged 5 ether)
* Both players will need to select a shape and type a string and then press ‘Lock’
* Once both players have locked their hashes they will be able to both reveal their shapes
* Both players will need to reveal their shapes by using the same shape and string
combination used before and pressing ‘Reveal’
* Once both players have revealed their shapes they will be able to distribute the reward -
the winner receives 10 ether (in the case of a draw both players receive 5 ether)
* The game will reset and players will be able to register again
