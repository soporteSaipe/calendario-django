"""
URL configuration for calendario_reservas project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.contrib.auth import views as auth_views
from django.http import JsonResponse, HttpResponse
from django.contrib import messages

def redirect_to_calendario(request):
    return redirect('calendario:calendario')

def healthcheck(request):
    from django.db import connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return HttpResponse("OK", content_type="text/plain")
    except Exception:
        return HttpResponse("DB unavailable", status=503, content_type="text/plain")

class CustomLoginView(auth_views.LoginView):
    """Vista personalizada de login con mejor manejo de errores"""
    template_name = 'registration/login.html'
    redirect_authenticated_user = True
    
    def form_invalid(self, form):
        """Manejar formulario inválido con mensajes específicos"""
        # Limpiar mensajes anteriores
        messages.set_level(self.request, messages.ERROR)
        
        # Verificar si hay errores específicos
        if 'username' in form.errors:
            messages.error(self.request, 'El nombre de usuario es requerido.')
        elif 'password' in form.errors:
            messages.error(self.request, 'La contraseña es requerida.')
        elif form.non_field_errors():
            # Error de autenticación
            messages.error(self.request, 'Usuario o contraseña incorrectos. Inténtalo de nuevo.')
        else:
            messages.error(self.request, 'Por favor, corrige los errores en el formulario.')
        
        return super().form_invalid(form)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', healthcheck),
    path('', redirect_to_calendario),
    path('calendario/', include('calendario.urls')),
    # URLs de autenticación
    path('accounts/login/', CustomLoginView.as_view(), name='login'),
    path('accounts/logout/', auth_views.LogoutView.as_view(
        next_page='calendario:calendario'
    ), name='logout'),
]
