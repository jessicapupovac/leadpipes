# -*- coding: utf-8 -*-
import os
from fabric.api import lcd, local, task

from fabric_aws_lambda import SetupTask
from fabric_aws_lambda import InvokeTask
from fabric_aws_lambda import MakeZipTask
from fabric_aws_lambda import AWSLambdaInvokeTask
from fabric_aws_lambda import AWSLambdaGetConfigTask
from fabric_aws_lambda import AWSLambdaUpdateCodeTask

BASE_PATH = os.path.realpath('lambda_functions')
LAMBDA_HANDLER = 'lambda_handler'
DEFAULT_FUNCTION = 'LeadPipesGenerateSessionID'

@task
def clean(function_name=DEFAULT_FUNCTION):
    zip_file = os.path.join(BASE_PATH, function_name, 'lambda_function.zip')
    lib_path = os.path.join(BASE_PATH, function_name, 'lib')
    install_prefix = os.path.join(BASE_PATH, function_name, 'local')
    for target in [zip_file, lib_path, install_prefix]:
        local('rm -rf {}'.format(target))


@task
def setup(function_name=DEFAULT_FUNCTION):
    task_setup = SetupTask(
        requirements=os.path.join(BASE_PATH, function_name, 'requirements.txt'),
        lib_path=os.path.join(BASE_PATH, function_name, 'lib'),
        install_prefix=os.path.join(BASE_PATH, function_name, 'local'),
    )
    task_setup.run()


@task
def invoke(function_name=DEFAULT_FUNCTION):
    task_invoke = InvokeTask(
        lambda_file=os.path.join(BASE_PATH, function_name, 'lambda_function.py'),
        lambda_handler=LAMBDA_HANDLER,
        event_file=os.path.join(BASE_PATH, function_name, 'event.json'),
        lib_path=os.path.join(BASE_PATH, function_name, 'lib'),
        timeout=300
    )
    task_invoke.run()


@task
def makezip(function_name=DEFAULT_FUNCTION):
    with lcd(os.path.join(BASE_PATH, function_name)):
        task_makezip = MakeZipTask(
            zip_file=os.path.join(BASE_PATH, function_name, 'lambda_function.zip'),
            exclude_file=os.path.join(BASE_PATH, function_name, 'exclude.lst'),
            lib_path=os.path.join(BASE_PATH, function_name, 'lib')
        )
        task_makezip.run()


@task
def aws_invoke(function_name=DEFAULT_FUNCTION):
    task_aws_invoke = AWSLambdaInvokeTask(
        function_name=function_name,
        payload='file://{}'.format(os.path.join(BASE_PATH, function_name, 'event.json'))
    )
    task_aws_invoke.run()


@task
def aws_config(function_name=DEFAULT_FUNCTION):
    task_aws_getconfig = AWSLambdaGetConfigTask(
        function_name=function_name,
    )
    task_aws_getconfig.run()


@task
def aws_updatecode(function_name=DEFAULT_FUNCTION):
    task_aws_updatecode = AWSLambdaUpdateCodeTask(
        function_name=function_name,
        zip_file='fileb://{}'.format(os.path.join(BASE_PATH, function_name, 'lambda_function.zip'))
    )
    task_aws_updatecode.run()


@task
def make(function_name=DEFAULT_FUNCTION):
    makezip(function_name)
    aws_updatecode(function_name)
    aws_invoke(function_name)
