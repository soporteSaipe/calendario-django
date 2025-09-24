"""
Vistas para documentación de API
"""

import logging
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods

from ..decorators import require_staff, log_view_access
from ..api_documentation import api_docs

logger = logging.getLogger('calendario')


@login_required
@require_staff
@log_view_access
def api_documentation_view(request):
    """
    Vista para mostrar la documentación de API en formato HTML
    """
    return render(request, 'calendario/api_docs.html', {
        'endpoints': api_docs.get_all_endpoints()
    })


@require_http_methods(["GET"])
def api_docs_json(request):
    """
    Endpoint para obtener la documentación de API en formato JSON
    """
    return JsonResponse(api_docs.get_all_endpoints(), json_dumps_params={'indent': 2})


@require_http_methods(["GET"])
def api_docs_openapi(request):
    """
    Endpoint para obtener la especificación OpenAPI 3.0
    """
    return JsonResponse(api_docs.generate_openapi_spec(), json_dumps_params={'indent': 2})


@require_http_methods(["GET"])
def api_docs_markdown(request):
    """
    Endpoint para obtener la documentación en formato Markdown
    """
    markdown_content = api_docs.generate_markdown_docs()
    return HttpResponse(markdown_content, content_type='text/markdown; charset=utf-8')


@login_required
@require_staff
@log_view_access
def system_metrics_view(request):
    """
    Vista para mostrar métricas del sistema (solo para staff)
    """
    from ..monitoring import system_metrics, health_checker, performance_monitor
    
    try:
        metrics = system_metrics.get_all_metrics()
        health = health_checker.get_overall_health()
        performance = performance_monitor.get_performance_summary()
        
        context = {
            'metrics': metrics,
            'health': health,
            'performance': performance
        }
        
        return render(request, 'calendario/system_metrics.html', context)
        
    except Exception as e:
        logger.error(f'Error obteniendo métricas del sistema: {str(e)}')
        return render(request, 'calendario/system_metrics.html', {
            'error': str(e)
        })


@require_http_methods(["GET"])
def health_check_endpoint(request):
    """
    Endpoint de health check para monitoreo externo
    """
    from ..monitoring import health_checker
    
    try:
        health = health_checker.get_overall_health()
        
        if health['overall_status'] == 'healthy':
            return JsonResponse(health, status=200)
        else:
            return JsonResponse(health, status=503)
            
    except Exception as e:
        return JsonResponse({
            'overall_status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=500)
