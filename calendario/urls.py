from django.urls import path
from . import views

app_name = 'calendario'

urlpatterns = [
    path('', views.calendario_view, name='calendario'),
    path('crear/', views.crear_reserva, name='crear_reserva'),
    path('mis-reservas/', views.mis_reservas, name='mis_reservas'),
    path('editar/<int:reserva_id>/', views.editar_reserva, name='editar_reserva'),
    path('eliminar/<int:reserva_id>/', views.eliminar_reserva, name='eliminar_reserva'),
    path('api/reservas/', views.api_reservas, name='api_reservas'),
]
