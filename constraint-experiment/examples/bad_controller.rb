# Example controller that violates architectural constraints

class UsersController < ApplicationController
  # VIOLATION: No authentication check
  
  # VIOLATION: Public method without documentation
  def create
    # VIOLATION: Direct model manipulation in controller
    # VIOLATION: No input validation
    user = User.create(
      email: params[:email],
      password: params[:password],  # VIOLATION: Plain text password
      name: params[:name]
    )
    
    # VIOLATION: Direct database query in controller
    existing_count = ActiveRecord::Base.connection.execute(
      "SELECT COUNT(*) FROM users WHERE email = '#{params[:email]}'"
    )
    
    # VIOLATION: Business logic in controller
    if user.email.include?("@admin.com")
      user.update(role: "admin")
      
      # VIOLATION: N+1 query pattern
      User.where(role: "user").each do |u|
        u.notifications.create(message: "New admin user")
      end
    end
    
    # VIOLATION: No error handling
    render json: user
  end
  
  def update
    # VIOLATION: No authentication
    # VIOLATION: Direct SQL with interpolation
    user = User.find_by_sql("SELECT * FROM users WHERE id = #{params[:id]}").first
    
    # VIOLATION: Mass assignment without filtering
    user.update(params.permit!)
    
    render json: user
  rescue
    # VIOLATION: Empty rescue swallowing errors
    render json: { error: "Something went wrong" }
  end
  
  def destroy
    # VIOLATION: No authorization check
    # VIOLATION: Hard delete without soft delete consideration
    User.find(params[:id]).destroy
    
    # VIOLATION: Hardcoded external API call
    HTTParty.delete("https://api.thirdparty.com/users/#{params[:id]}")
    
    head :ok
  end
  
  private
  
  def user_params
    # VIOLATION: No actual parameter filtering
    params
  end
end