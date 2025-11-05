import { useState } from 'react'
import { supabase, db } from '../lib/supabase'

const TestConnection = () => {
  const [results, setResults] = useState({})
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    setTesting(true)
    const testResults = {}

    try {
      // Test 1: Supabase connection
      try {
        const { data, error } = await supabase.from('categories').select('count(*)')
        testResults.connection = error ? `❌ ${error.message}` : '✅ Connected'
      } catch (err) {
        testResults.connection = `❌ ${err.message}`
      }

      // Test 2: Categories table
      try {
        const categories = await db.getCategories()
        testResults.categories = `✅ Found ${categories?.length || 0} categories`
      } catch (err) {
        testResults.categories = `❌ ${err.message}`
      }

      // Test 3: Books table
      try {
        const books = await db.getBooks()
        testResults.books = `✅ Found ${books?.length || 0} books`
      } catch (err) {
        testResults.books = `❌ ${err.message}`
      }

      // Test 4: Users table
      try {
        const users = await db.getAppUsers()
        testResults.users = `✅ Found ${users?.length || 0} users`
      } catch (err) {
        testResults.users = `❌ ${err.message}`
      }

      // Test 5: Banners table
      try {
        const banners = await db.getBanners()
        testResults.banners = `✅ Found ${banners?.length || 0} banners`
      } catch (err) {
        testResults.banners = `❌ ${err.message}`
      }

      // Test 6: Dashboard stats
      try {
        const stats = await db.getDashboardStats()
        testResults.dashboard = `✅ Stats loaded: ${JSON.stringify(stats)}`
      } catch (err) {
        testResults.dashboard = `❌ ${err.message}`
      }

      // Test 7: Storage bucket
      try {
        const { data, error } = await supabase.storage
          .from('product-media')
          .list('', { limit: 1 })
        testResults.storage = error ? `❌ ${error.message}` : '✅ Storage bucket accessible'
      } catch (err) {
        testResults.storage = `❌ ${err.message}`
      }

      // Test 8: Admin users table
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('count(*)')
        testResults.adminUsers = error ? `❌ ${error.message}` : `✅ Admin users table exists`
      } catch (err) {
        testResults.adminUsers = `❌ ${err.message}`
      }

      setResults(testResults)
    } catch (err) {
      setResults({ error: `❌ General error: ${err.message}` })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>🧪 Supabase Connection Test</h2>
      <p>This component tests all database connections and table structures.</p>
      
      <button 
        onClick={runTests} 
        disabled={testing}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: testing ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {testing ? 'Testing...' : 'Run Tests'}
      </button>

      {Object.keys(results).length > 0 && (
        <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
          <h3>Test Results:</h3>
          {Object.entries(results).map(([test, result]) => (
            <div key={test} style={{ marginBottom: '8px' }}>
              <strong>{test}:</strong> {result}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>Setup Checklist:</h3>
        <ol>
          <li>✅ Run the SQL migration script in Supabase</li>
          <li>✅ Create 'product-media' storage bucket (public)</li>
          <li>✅ Configure storage policies</li>
          <li>✅ Add admin user to admin_users table</li>
          <li>✅ Set environment variables in .env.local</li>
        </ol>
        
        <p><strong>Environment Status:</strong></p>
        <ul>
          <li>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</li>
          <li>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</li>
        </ul>
        
        <p><strong>If tests fail:</strong></p>
        <ul>
          <li>Check the setup_supabase.md file for detailed instructions</li>
          <li>Verify your Supabase URL and anon key in .env.local</li>
          <li>Make sure you've run the complete migration script</li>
          <li>Check Supabase dashboard for any error messages</li>
        </ul>
      </div>
    </div>
  )
}

export default TestConnection
