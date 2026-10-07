from django.db import models
from django.contrib.auth.models import AbstractUser

# Some kinds of projects may have authentication requirements for which Django’s built-in User model 
# is not always appropriate. For instance, on some sites it makes more sense to use an email address 
# as your identification token instead of a username

#isso é capaz de customizar o login e capacitar ele utilizando ou email ou user.

class CustomUser(AbstractUser):
    USERNAME_FIELD = 'email'
    email = models.EmailField(unique=True)
    REQUIRED_FIELDS = []