from django.http import JsonResponse


def health_check(_):
    return JsonResponse({'message': 'ok'})
