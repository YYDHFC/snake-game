// needed: 
// position.scaleBy()
// getRange()
// getGameInitialState()
// getNewGameState()

const UPDATE_EVERY = 1000 / 60

const MOVEMENT_KEYS = {
  TOP: [87, 38],
  RIGHT: [68, 39],
  DOWN: [83, 40],
  LEFT: [65, 37]
}

const STOP_KEY = 32

// #region rendering
const getContainer = () => document.getElementById('container')

const getContainerSize = () => {
  const { width, height } = getContainer().getBoundingClientRect()
  return { width, height }
}

const clearContainer = () => {
  const container = getContainer()
  const [child] = container.children
  if (child) {
    container.removeChild(child)
  }
}

const getProjectors = (containerSize, game) => {
  const widthRatio = containerSize.width / game.width
  const heightRatio = containerSize.height / game.height
  const unitOnScreen = Math.min(widthRatio, heightRatio)

  return {
    projectDistance: distance => distance * unitOnScreen,
    projectPosition: position => position.scaleBy(unitOnScreen)
  }
}

const getContext = (width, height) => {
  const [existing] = document.getElementsByTagName('canvas')
  const canvas = existing || document.createElement('canvas')
  if (!existing) {
    getContainer().appendChild(canvas)
  }
  const context = canvas.getContext('2d')
  context.clearRect(0, 0, canvas.width, canvas.height)
  canvas.setAttribute('width', width)
  canvas.setAttribute('height', height)
  return context
}

const renderCells = (context, cellSide, width, height) => {
  context.globalAlpha = 0.2
  getRange(width).forEach(column => getRange(height).forEach(row => {
    if ((column + row) % 2 === 1) {
      context.fillRect(column * cellSide, row * cellSide, cellSide, cellSide)
    }
  }))
  context.globalAlpha = 1
}

const renderFood = (context, cellSide, { x, y }) => {
  context.beginPath()
  context.arc(x, y, cellSide / 2.5, 0, 2 * Math.PI)
  context.fillStyle = '#e74c3c'
  context.fill()
}

const renderSnake = (context, cellSide, snake) => {
  context.lineWidth = cellSide
  context.strokeStyle = '#3498db'
  context.beginPath()
  snake.forEach(({ x, y }) => context.lineTo(x, y))
  context.stroke()
}

const renderScores = (score, bestScore) => {
  document.getElementById('current-score').innerText = score
  document.getElementById('best-score').innerText = bestScore
}

const render = ({
  game: {
    width,
    height,
    food,
    snake,
    score
  },
  bestScore,
  projectDistance,
  projectPosition
}) => {
  const [viewWidth, viewHeight] = [width, height].map(projectDistance)
  const context = getContext(viewWidth, viewHeight)
  const cellSide = viewWidth / width
  renderCells(context, cellSide, width, height)
  renderFood(context, cellSide, projectPosition(food))
  renderSnake(context, cellSide, snake.map(projectPosition))
  renderScores(score, bestScore)
}
// #endregion

// #region main
const getInitialState = () => {
  const game = getGameInitialState()
  const containerSize = getContainerSize()
  return {
    game,
    bestScore: parseInt(localStorage.bestScore) || 0,
    ...containerSize,
    ...getProjectors(containerSize, game)
  }
}

const getNewStatePropsOnTick = (oldState) => {
  if (oldState.stopTime) return oldState

  const lastUpdate = Date.now()
  if (oldState.lastUpdate) {
    const game = getNewGameState(
      oldState.game,
      oldState.movement,
      lastUpdate - oldState.lastUpdate
    )
    const newProps = {
      game,
      lastUpdate
    }
    if (game.score > oldState.bestScore) {
      localStorage.setItem('bestScore', game.score)
      return {
        ...newProps,
        bestScore: game.score
      }
    }
    return newProps
  }

  return {
    lastUpdate
  }
}

const startGame = () => {
  let state = getInitialState()
  const updateState = props => {
    state = { ...state, ...props }
  }

  window.addEventListener('resize', () => {
    clearContainer()
    const containerSize = getContainerSize()
    updateState({ ...containerSize, ...getProjectors(containerSize, state.game) })
    tick()
  })
  window.addEventListener('keydown', ({ which }) => {
    const entries = Object.entries(MOVEMENT_KEYS)
    const [movement] = entries.find(([, keys]) => keys.includes(which)) || [undefined]
    updateState({ movement })
  })
  window.addEventListener('keyup', ({ which }) => {
    updateState({ movement: undefined })
    if (which === STOP_KEY) {
      const now = Date.now()
      if (state.stopTime) {
        updateState({ stopTime: undefined, lastUpdate: state.time + now - state.lastUpdate })
      } else {
        updateState({ stopTime: now })
      }
    }
  })

  const tick = () => {
    const newProps = getNewStatePropsOnTick(state)
    updateState(newProps)
    render(state)
  }
  setInterval(tick, UPDATE_EVERY)
}
// #endregion

startGame()