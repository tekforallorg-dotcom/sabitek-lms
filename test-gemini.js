// test-gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai')

const API_KEY = 'AIzaSyBuvaV-VRoeVxbTnjwAu5H41I2psbyZ9fU'

async function testModels() {
  console.log('Testing Gemini API with NEW model names...\n')
  console.log('API Key:', API_KEY.substring(0, 10) + '...\n')
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY)
    
    // NEW model names from your documentation
    const modelsToTry = [
      'gemini-2.0-flash-lite',      // YOUR CHOICE - cheapest & fastest
      'gemini-2.0-flash',            // Alternative
      'gemini-2.5-flash-lite',       // Better quality
      'gemini-2.5-flash',            // Balanced
      'gemini-2.5-pro',              // Most advanced
    ]
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing: ${modelName}...`)
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent('Say hello in one word')
        const response = await result.response
        
        console.log(`✅ ${modelName} WORKS!`)
        console.log(`   Response: ${response.text()}`)
        console.log(`   This model is available!\n`)
        break // Stop after first working model
      } catch (error) {
        console.log(`❌ ${modelName} failed`)
        console.log(`   Error: ${error.message}\n`)
      }
    }
  } catch (error) {
    console.error('Fatal error:', error.message)
  }
}

testModels()