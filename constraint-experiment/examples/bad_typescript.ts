// Example TypeScript code that violates architectural constraints
// This demonstrates how Ruby DSL can constrain any target language

import { UserService } from './services/user'  // Should come after relative imports
import _ from 'lodash'
import React, { useMemo, useState, useEffect, useCallback } from 'react'  // Hooks in wrong order
import './styles.css'

// VIOLATION: Using 'any' type
export default function UserManager(): any {
  // VIOLATION: React hooks in wrong order (useMemo before useState)
  const memoizedValue = useMemo(() => someExpensiveCalc(), [])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  
  // VIOLATION: let instead of const for non-reassigned variable
  let apiUrl = 'https://api.example.com'  
  
  useEffect(() => {
    fetchUsers()
  }, [])
  
  // VIOLATION: console.log in production code
  const fetchUsers = async () => {
    console.log('Fetching users...')
    setLoading(true)
    
    try {
      // VIOLATION: Missing Promise return type annotation
      const response = await fetch(apiUrl + '/users')
      const userData = await response.json()
      setUsers(userData)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // VIOLATION: SQL injection vulnerability with template literals
  const searchUsers = async (query: string) => {
    const sql = `SELECT * FROM users WHERE name LIKE '%${query}%'`
    // VIOLATION: eval usage
    const result = eval(`database.query("${sql}")`)
    return result
  }
  
  // VIOLATION: Nested loops causing O(n³) complexity
  const processUsers = (users: any[]) => {
    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < users[i].posts.length; j++) {
        for (let k = 0; k < users[i].posts[j].comments.length; k++) {
          // Process each comment
          users[i].posts[j].comments[k].processed = true
        }
      }
    }
  }
  
  // VIOLATION: Express middleware without error handling
  const middleware = (req: any, res: any) => {
    // No try-catch or next() error handling
    const userData = JSON.parse(req.body.userData)
    res.json(userData)
  }
  
  // VIOLATION: String concatenation in SQL-like query
  const updateUser = (id: string, name: string) => {
    const query = "UPDATE users SET name = '" + name + "' WHERE id = " + id
    return database.execute(query)
  }
  
  return (
    <div>
      <h1>User Manager</h1>
      {loading ? <div>Loading...</div> : null}
      {users.map((user: any) => (  // VIOLATION: any type usage
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}

// Test file violations
describe('UserManager', () => {
  // VIOLATION: Async test without proper handling
  it('should fetch users', () => {
    const promise = fetchUsers()
    // Missing await or return statement
  })
})

// VIOLATION: Using Function constructor
const dynamicFunction = new Function('a', 'b', 'return a + b')