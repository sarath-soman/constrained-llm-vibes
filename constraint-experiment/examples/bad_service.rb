# Example of code that violates architectural constraints
# This should trigger multiple violations when checked

class UserSignup  # VIOLATION: Should be UserSignupService
  def self.register(email, password, name)
    # VIOLATION: No input validation
    # VIOLATION: No error handling
    # VIOLATION: Hardcoded values
    
    user = User.new
    user.email = email
    user.password = "secret123"  # VIOLATION: Hardcoded password/secret
    user.name = name
    
    # VIOLATION: Direct database query with string interpolation (SQL injection risk)
    existing = ActiveRecord::Base.connection.execute(
      "SELECT * FROM users WHERE email = '#{email}'"
    )
    
    if existing.any?
      return nil  # VIOLATION: Silent failure
    end
    
    # VIOLATION: No transaction wrapping
    user.save
    
    # VIOLATION: Potential N+1 query pattern
    User.all.each do |u|
      u.posts.each do |post|
        post.update(status: 'active')
      end
    end
    
    # VIOLATION: Direct external API call without error handling
    response = HTTParty.get("https://api.example.com/welcome?email=#{email}")
    
    user
  rescue
    # VIOLATION: Empty rescue block swallowing all errors
  end
  
  # VIOLATION: Public method without documentation
  def send_notification(user_id)
    # VIOLATION: Direct database access in service
    user = ActiveRecord::Base.connection.select_one(
      "SELECT email FROM users WHERE id = #{user_id}"
    )
    
    # VIOLATION: No null checking
    puts "Sending to: #{user['email']}"
  end
end