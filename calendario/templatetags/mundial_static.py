from django import template
from django.templatetags.static import static

from calendario.constants import MundialThemeConfig

register = template.Library()


@register.simple_tag
def static_v(path):
    url = static(path)
    if MundialThemeConfig.ENABLED:
        return f'{url}?v={MundialThemeConfig.STATIC_VERSION}'
    return url
