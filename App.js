import React, { useRef, useState, useEffect } from "react";
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, Dimensions } from "react-native";
import { GameEngine } from "react-native-game-engine";
import Constants from "./Constants";
import GameLoop from "./systems/GameLoop";
import Food from "./components/Food";
import Head from "./components/Head";
import Tail from "./components/Tail";

const { width, height } = Dimensions.get('window');
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Function to generate random positions within the grid boundaries
const getRandomPositionWithinBounds = () => {
  const x = Math.floor(Math.random() * Constants.GRID_SIZE);
  const y = Math.floor(Math.random() * Constants.GRID_SIZE);
  return [x, y];
};

export default function App() {
  const engine = useRef(null);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [currentFood, setCurrentFood] = useState(alphabet[Math.floor(Math.random() * alphabet.length)]);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [tail, setTail] = useState([]);
  const [difficulty, setDifficulty] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);

  useEffect(() => {
    if (isGameStarted && engine.current) {
      resetGame();
    }
  }, [isGameStarted]);

  const startGame = (level) => {
    setDifficulty(level);
    setIsGameStarted(true);
    setIsGameRunning(true);
  };

  const resetGame = () => {
    setScore(0);
    setWrong(0);
    setTail([]);
    setIsGameOver(false);
    setIsGameRunning(true);

    const newFood = alphabet[Math.floor(Math.random() * alphabet.length)];
    setCurrentFood(newFood);
    const newFoodPosition = getRandomPositionWithinBounds();
    const headStartPosition = getRandomPositionWithinBounds();

    if (engine.current) {
      engine.current.swap({
        head: {
          position: headStartPosition,
          size: Constants.CELL_SIZE,
          updateFrequency: getSnakeSpeed(difficulty),
          nextMove: getSnakeSpeed(difficulty),
          xspeed: 7,
          yspeed: 0,
          moving: false,
          currentFood: newFood, // Display the current food inside the head
          renderer: <Head />,
        },
        food: {
          position: newFoodPosition,
          size: Constants.CELL_SIZE,
          currentFood: newFood,
          renderer: <Food />,
        },
        tail: {
          size: Constants.CELL_SIZE,
          elements: tail,
          renderer: <Tail />,
        },
      });
      engine.current.dispatch({ type: 'reset-food', position: newFoodPosition, newFood });
    }
  };

  const handleKeyPress = (char) => {
    const inputText = char.toUpperCase();

    if (inputText === currentFood) {
      setScore(score + 1);
      const newFood = alphabet[Math.floor(Math.random() * alphabet.length)];
      setCurrentFood(newFood);
      if (engine.current) {
        engine.current.dispatch({ type: 'move-snake-to-food' });
      }
    } else {
      setWrong(wrong + 1);
    }
  };

  const handleGameEvent = (event) => {
    if (event.type === 'food-eaten') {
      setTail([...tail, { position: [...tail[tail.length - 1]?.position || [0, 0]] }]);
      const newFood = alphabet[Math.floor(Math.random() * alphabet.length)];
      setCurrentFood(newFood);
      const newFoodPosition = getRandomPositionWithinBounds();
      if (engine.current) {
        engine.current.dispatch({ type: 'reset-food', position: newFoodPosition, newFood });
      }
    } else if (event.type === 'game-over') {
      setIsGameRunning(false);
      setIsGameOver(true);
    } else if (event.type === 'game-restart') {
      setIsGameRunning(true);
      setIsGameOver(false);
    }
  };

  const getSnakeSpeed = (level) => {
    switch (level) {
      case 'easy':
        return 40;
      case 'medium':
        return 25;
      case 'hard':
        return 10;
      default:
        return 30;
    }
  };

  const boardSize = Math.min(width, height) * 0.8;

  if (!isGameStarted) {
    return (
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeText}>Welcome to the Snake Game!</Text>
        <Text style={styles.selectDifficultyText}>Select Difficulty Level:</Text>
        <TouchableOpacity style={[styles.difficultyButton, styles.easyButton]} onPress={() => startGame('easy')}>
          <Text style={styles.difficultyButtonText}>Easy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.difficultyButton, styles.mediumButton]} onPress={() => startGame('medium')}>
          <Text style={styles.difficultyButtonText}>Medium</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.difficultyButton, styles.hardButton]} onPress={() => startGame('hard')}>
          <Text style={styles.difficultyButtonText}>Hard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      {!isGameOver && (
        <>
          {/* Move the Scoreboard above the game area */}
          <View style={styles.scoreboardContainer}>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>Score: {score}</Text>
              <Text style={styles.scoreText}>Wrong: {wrong}</Text>
            </View>
          </View>
          <View style={styles.gameArea}>
            <GameEngine
              ref={engine}
              style={[styles.board, { width: boardSize, height: boardSize }]}
              entities={{
                head: {
                  position: [0, 0],
                  size: Constants.CELL_SIZE,
                  updateFrequency: getSnakeSpeed(difficulty),
                  nextMove: getSnakeSpeed(difficulty),
                  xspeed: 0,
                  yspeed: 0,
                  moving: false,
                  currentFood: currentFood, // Pass the letter to the Head component
                  renderer: <Head />,
                },
                food: {
                  position: getRandomPositionWithinBounds(),
                  size: Constants.CELL_SIZE,
                  currentFood: currentFood,
                  renderer: <Food />,
                },
                tail: {
                  size: Constants.CELL_SIZE,
                  elements: tail,
                  renderer: <Tail />,
                },
              }}
              systems={[GameLoop]}
              running={isGameRunning}
              onEvent={handleGameEvent}
            />
          </View>
        </>
      )}
      {!isGameOver && (
        <View style={styles.keyboard}>
          {[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((char) => (
            <TouchableOpacity
              key={char}
              style={styles.keyboardKey}
              onPress={() => handleKeyPress(char)}
            >
              <Text style={styles.keyboardText}>{char}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {isGameOver && (
        <View style={styles.restartContainer}>
          <TouchableOpacity style={styles.restartButton} onPress={resetGame}>
            <Text style={styles.restartButtonText}>Restart Game</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const baseUnit = width * 0.01; // 1% of screen width as base unit

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6e0b5", // Light beige background for a soft and welcoming feel.
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: baseUnit * 2, // Equivalent to 2em
    fontWeight: 'bold',
    color: '#66545e',
    textShadowColor: '#a39193',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  selectDifficultyText: {
    fontSize: baseUnit * 1.5, // Equivalent to 1.5em
    color: '#66545e',
    marginVertical: baseUnit * 1.2,
  },
  difficultyButton: {
    width: baseUnit * 10,
    height: baseUnit * 3.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: baseUnit * 0.8,
    borderRadius: baseUnit * 1,
  },
  easyButton: {
    backgroundColor: '#b0c4b1',
  },
  mediumButton: {
    backgroundColor: '#f6b5a6',
  },
  hardButton: {
    backgroundColor: '#ff6f61',
  },
  difficultyButtonText: {
    fontSize: baseUnit * 1.3,
    color: '#fff',
  },
  scoreboardContainer: {
    marginVertical: baseUnit,
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: baseUnit * 0.5,
    paddingVertical: baseUnit,
    paddingHorizontal: baseUnit * 1.5,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
  },
  scoreText: {
    fontSize: baseUnit * 1.3,
    color: '#383e56',
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    backgroundColor: '#fef6e6',
    borderWidth: 5,
    borderColor: '#f6b5a6',
  },
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: baseUnit * 2,
  },
  keyboardKey: {
    backgroundColor: '#66545e',
    padding: baseUnit * 1.5,
    margin: baseUnit * 0.5,
    borderRadius: baseUnit * 0.8,
  },
  keyboardText: {
    color: '#fff',
    fontSize: baseUnit * 1.5,
  },
  restartContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
  },
  restartButton: {
    backgroundColor: '#ff6f61',
    padding: baseUnit * 2,
    borderRadius: baseUnit,
  },
  restartButtonText: {
    color: '#fff',
    fontSize: baseUnit * 1.5,
  },
});
