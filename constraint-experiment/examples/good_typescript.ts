// Example TypeScript code that follows architectural constraints
// Demonstrates clean, well-structured code that passes validation

import _ from 'lodash'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { UserService } from './services/user'
import { Logger } from '../utils/logger'
import './styles.css'

interface User {
  id: string
  name: string
  email: string
  posts?: Post[]
}

interface Post {
  id: string
  title: string
  content: string
  comments?: Comment[]
}

interface Comment {
  id: string
  content: string
  author: string
}

export const UserManager: React.FC = (): JSX.Element => {
  // React hooks in correct order
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchUsers()
  }, [])
  
  // Custom hook
  const userService = useCallback(() => new UserService(), [])
  
  // useMemo last
  const memoizedUsers = useMemo(() => {
    return users.filter(user => user.email.includes('@'))
  }, [users])
  
  // Proper const usage for non-reassigned variable
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000'
  
  // Async function with proper Promise return type
  const fetchUsers = async (): Promise<void> => {
    setLoading(true)
    setError(null)
    
    try {
      const userData = await userService().getUsers()
      setUsers(userData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      Logger.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Secure search using parameterized queries
  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      return await userService().searchUsers({ name: query })
    } catch (err) {
      Logger.error('Search failed:', err)
      throw err
    }
  }
  
  // Efficient processing avoiding nested loops
  const processUsers = (users: User[]): User[] => {
    // Use Map for O(1) lookups instead of nested loops
    const processedComments = new Map<string, boolean>()
    
    return users.map(user => ({
      ...user,
      posts: user.posts?.map(post => ({
        ...post,
        comments: post.comments?.map(comment => {
          const processed = !processedComments.has(comment.id)
          processedComments.set(comment.id, true)
          return { ...comment, processed }
        })
      }))
    }))
  }
  
  // Express middleware with proper error handling
  const createUserMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const userData = req.body as Partial<User>
      
      if (!userData.email || !userData.name) {
        res.status(400).json({ error: 'Email and name are required' })
        return
      }
      
      // Process user data
      next()
    } catch (error) {
      next(error) // Pass error to Express error handler
    }
  }
  
  // Safe database operations using ORM/query builder
  const updateUser = async (id: string, name: string): Promise<User> => {
    return await userService().updateUser(id, { name })
  }
  
  if (error) {
    return <div className="error">Error: {error}</div>
  }
  
  return (
    <div className="user-manager">
      <h1>User Manager</h1>
      {loading ? <div className="loading">Loading...</div> : null}
      <div className="user-list">
        {memoizedUsers.map((user: User) => (
          <div key={user.id} className="user-card">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// Properly structured test file
describe('UserManager', () => {
  it('should fetch users successfully', async (): Promise<void> => {
    const mockUsers: User[] = [
      { id: '1', name: 'John Doe', email: 'john@example.com' }
    ]
    
    jest.spyOn(UserService.prototype, 'getUsers').mockResolvedValue(mockUsers)
    
    const result = await new UserService().getUsers()
    expect(result).toEqual(mockUsers)
  })
  
  it('should handle search errors', async (): Promise<void> => {
    const service = new UserService()
    jest.spyOn(service, 'searchUsers').mockRejectedValue(new Error('Network error'))
    
    await expect(service.searchUsers({ name: 'John' })).rejects.toThrow('Network error')
  })
})