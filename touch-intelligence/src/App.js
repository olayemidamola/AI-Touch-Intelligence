import React, { useState, useRef, useEffect } from 'react';
import { Brain, Activity, TrendingUp, Check, X } from 'lucide-react';

const TouchIntelligenceDemo = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [touchData, setTouchData] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [mode, setMode] = useState('classify'); // classify or train
  const [trainingLabel, setTrainingLabel] = useState('tap');
  const [learningHistory, setLearningHistory] = useState([]);
  const [modelAccuracy, setModelAccuracy] = useState(75);
  const [sessionCount, setSessionCount] = useState(0);

  const gestureTypes = [
    { name: 'tap', color: '#3b82f6', description: 'Quick tap' },
    { name: 'double-tap', color: '#8b5cf6', description: 'Two quick taps' },
    { name: 'stroke', color: '#10b981', description: 'Sliding motion' },
    { name: 'pressure', color: '#f59e0b', description: 'Sustained press' },
    { name: 'circle', color: '#ef4444', description: 'Circular shape' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTouchData([{ x, y, timestamp: Date.now(), pressure: 1 }]);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    
    if (touchData.length > 0) {
      const lastPoint = touchData[touchData.length - 1];
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    setTouchData(prev => [...prev, { x, y, timestamp: Date.now(), pressure: 1 }]);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (touchData.length > 2) {
      if (mode === 'classify') {
        classifyGesture();
      } else {
        trainModel();
      }
    }
  };

  const classifyGesture = () => {
    const features = extractFeatures(touchData);
    const result = predictGesture(features);
    setPrediction(result.gesture);
    setConfidence(result.confidence);
    
    // Simulate learning
    setSessionCount(prev => prev + 1);
    if (sessionCount > 0 && sessionCount % 5 === 0) {
      setModelAccuracy(prev => Math.min(95, prev + 2));
    }
  };

  const trainModel = () => {
    const features = extractFeatures(touchData);
    setLearningHistory(prev => [
      ...prev,
      { gesture: trainingLabel, timestamp: new Date().toLocaleTimeString(), features }
    ].slice(-5));
    
    setModelAccuracy(prev => Math.min(98, prev + 1.5));
    
    // Visual feedback
    setPrediction(trainingLabel);
    setConfidence(100);
    
    setTimeout(() => {
      clearCanvas();
      setPrediction(null);
    }, 1500);
  };

  const extractFeatures = (data) => {
    if (data.length < 2) return {};

    const duration = data[data.length - 1].timestamp - data[0].timestamp;
    const distances = [];
    let totalDistance = 0;

    for (let i = 1; i < data.length; i++) {
      const dx = data[i].x - data[i-1].x;
      const dy = data[i].y - data[i-1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      distances.push(dist);
      totalDistance += dist;
    }

    const avgDistance = totalDistance / distances.length;
    const velocity = totalDistance / duration;

    // Calculate circularity
    const startPoint = data[0];
    const endPoint = data[data.length - 1];
    const closure = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + 
      Math.pow(endPoint.y - startPoint.y, 2)
    );
    const circularity = closure / totalDistance;

    return {
      duration,
      totalDistance,
      avgDistance,
      velocity,
      circularity,
      pointCount: data.length
    };
  };

  const predictGesture = (features) => {
    const { duration, totalDistance, velocity, circularity, pointCount } = features;

    // Simple rule-based classifier (simulating ML model)
    let gesture = 'tap';
    let confidence = 70;

    if (duration < 150 && totalDistance < 20) {
      gesture = 'tap';
      confidence = 85 + Math.random() * 10;
    } else if (duration < 300 && pointCount < 10 && totalDistance < 30) {
      gesture = 'double-tap';
      confidence = 80 + Math.random() * 10;
    } else if (circularity < 0.3 && totalDistance > 50) {
      gesture = 'stroke';
      confidence = 88 + Math.random() * 8;
    } else if (duration > 500 && totalDistance < 30) {
      gesture = 'pressure';
      confidence = 82 + Math.random() * 12;
    } else if (circularity < 0.15 && totalDistance > 80) {
      gesture = 'circle';
      confidence = 79 + Math.random() * 15;
    }

    // Apply learning boost
    confidence = Math.min(99, confidence + (modelAccuracy - 75) * 0.5);

    return { gesture, confidence: Math.round(confidence) };
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setTouchData([]);
    setPrediction(null);
    setConfidence(0);
  };

  const provideFeedback = (isCorrect) => {
    if (isCorrect) {
      setModelAccuracy(prev => Math.min(99, prev + 0.5));
    } else {
      setModelAccuracy(prev => Math.max(70, prev - 0.3));
    }
    clearCanvas();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-12 h-12 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">AI Touch Intelligence</h1>
          </div>
          <p className="text-blue-200 text-lg">Neuromorphic Touch Pattern Recognition System</p>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-4 mb-6 justify-center">
          <button
            onClick={() => setMode('classify')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              mode === 'classify'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <Activity className="inline w-5 h-5 mr-2" />
            Classify Mode
          </button>
          <button
            onClick={() => setMode('train')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              mode === 'train'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            <TrendingUp className="inline w-5 h-5 mr-2" />
            Training Mode
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800 rounded-xl p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">
                  {mode === 'classify' ? 'Draw Your Gesture' : 'Training Canvas'}
                </h2>
                <button
                  onClick={clearCanvas}
                  className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                >
                  Clear
                </button>
              </div>

              {mode === 'train' && (
                <div className="mb-4">
                  <label className="text-white mb-2 block">Select Gesture Type:</label>
                  <select
                    value={trainingLabel}
                    onChange={(e) => setTrainingLabel(e.target.value)}
                    className="w-full p-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                  >
                    {gestureTypes.map(g => (
                      <option key={g.name} value={g.name}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="border-4 border-slate-600 rounded-lg cursor-crosshair w-full"
                style={{ touchAction: 'none' }}
              />

              {/* Prediction Result */}
              {prediction && mode === 'classify' && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white text-sm font-semibold">Detected Gesture:</p>
                      <p className="text-2xl font-bold text-white capitalize">{prediction}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm font-semibold">Confidence:</p>
                      <p className="text-2xl font-bold text-white">{confidence}%</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => provideFeedback(true)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold transition-colors"
                    >
                      <Check className="inline w-5 h-5 mr-1" />
                      Correct
                    </button>
                    <button
                      onClick={() => provideFeedback(false)}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold transition-colors"
                    >
                      <X className="inline w-5 h-5 mr-1" />
                      Wrong
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Model Stats */}
            <div className="bg-slate-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Model Performance</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-slate-300 mb-2">
                    <span>Accuracy</span>
                    <span>{modelAccuracy.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${modelAccuracy}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                  <div>
                    <p className="text-slate-400 text-sm">Sessions</p>
                    <p className="text-2xl font-bold text-white">{sessionCount}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Training Samples</p>
                    <p className="text-2xl font-bold text-white">{learningHistory.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gesture Types */}
            <div className="bg-slate-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-4">Gesture Types</h3>
              <div className="space-y-2">
                {gestureTypes.map(gesture => (
                  <div
                    key={gesture.name}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: gesture.color }}
                    />
                    <div>
                      <p className="text-white font-medium capitalize">{gesture.name}</p>
                      <p className="text-slate-400 text-xs">{gesture.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Training */}
            {learningHistory.length > 0 && (
              <div className="bg-slate-800 rounded-xl p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Training</h3>
                <div className="space-y-2">
                  {learningHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-slate-700 rounded-lg text-sm"
                    >
                      <span className="text-white capitalize">{item.gesture}</span>
                      <span className="text-slate-400">{item.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-slate-800 rounded-xl p-6 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-3">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
            <div>
              <p className="font-semibold text-blue-400 mb-2">Classify Mode:</p>
              <ul className="space-y-1 text-sm">
                <li>• Draw gestures on the canvas</li>
                <li>• AI predicts the gesture type</li>
                <li>• Provide feedback to improve accuracy</li>
                <li>• Watch the model learn your patterns</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-purple-400 mb-2">Training Mode:</p>
              <ul className="space-y-1 text-sm">
                <li>• Select a gesture type</li>
                <li>• Draw examples to train the model</li>
                <li>• System learns your unique touch style</li>
                <li>• Accuracy improves with more samples</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TouchIntelligenceDemo;