# Example of code that follows architectural constraints

class UserRegistrationService
  # Registers a new user with validation and proper error handling
  def self.call(email:, password:, name:)
    new(email: email, password: password, name: name).call
  end

  def initialize(email:, password:, name:)
    @email = email
    @password = password
    @name = name
  end

  # Main registration logic with proper error handling
  def call
    validate_input!
    
    ActiveRecord::Base.transaction do
      user = create_user
      send_welcome_email(user)
      user
    end
  rescue ValidationError => e
    Rails.logger.error "User registration failed: #{e.message}"
    raise e
  rescue StandardError => e
    Rails.logger.error "Unexpected error during registration: #{e.message}"
    raise ServiceError, "Registration failed"
  end

  private

  # Validates user input before processing
  def validate_input!
    raise ValidationError, "Email is required" if @email.blank?
    raise ValidationError, "Password is required" if @password.blank?
    raise ValidationError, "Name is required" if @name.blank?
    raise ValidationError, "Invalid email format" unless valid_email?
    raise ValidationError, "Password too short" if @password.length < 8
  end

  # Creates the user record
  def create_user
    User.create!(
      email: @email,
      password_digest: BCrypt::Password.create(@password),
      name: @name
    )
  end

  # Sends welcome email to new user
  def send_welcome_email(user)
    UserMailer.welcome(user).deliver_later
  end

  # Validates email format
  def valid_email?
    @email.match?(/\A[\w+\-.]+@[a-z\d\-]+(\.[a-z\d\-]+)*\.[a-z]+\z/i)
  end
end