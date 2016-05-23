# -*- coding: utf-8 -*-
import os
from fabric.api import lcd, local, require, task
from fabric.state import env

from fabric_aws_lambda import SetupTask
from fabric_aws_lambda import InvokeTask
from fabric_aws_lambda import MakeZipTask
from fabric_aws_lambda import AWSLambdaInvokeTask
from fabric_aws_lambda import AWSLambdaGetConfigTask
from fabric_aws_lambda import AWSLambdaUpdateCodeTask

BASE_PATH = os.path.realpath('lambda_functions')
LAMBDA_HANDLER = 'lambda_handler'

@task
def lambda_function(function_name):
    env.lambda_function = function_name


@task
def clean():
    require('lambda_function')
    zip_file = os.path.join(BASE_PATH, env.lambda_function, 'lambda_function.zip')
    lib_path = os.path.join(BASE_PATH, env.lambda_function, 'lib')
    install_prefix = os.path.join(BASE_PATH, env.lambda_function, 'local')
    for target in [zip_file, lib_path, install_prefix]:
        local('rm -rf {}'.format(target))


@task
def install_reqs():
    require('lambda_function')
    task_setup = SetupTask(
        requirements=os.path.join(BASE_PATH, env.lambda_function, 'requirements.txt'),
        lib_path=os.path.join(BASE_PATH, env.lambda_function, 'lib'),
        install_prefix=os.path.join(BASE_PATH, env.lambda_function, 'local'),
    )
    task_setup.run()


@task
def invoke():
    require('lambda_function')
    task_invoke = InvokeTask(
        lambda_file=os.path.join(BASE_PATH, env.lambda_function, 'lambda_function.py'),
        lambda_handler=LAMBDA_HANDLER,
        event_file=os.path.join(BASE_PATH, env.lambda_function, 'event.json'),
        lib_path=os.path.join(BASE_PATH, env.lambda_function, 'lib'),
        timeout=300
    )
    task_invoke.run()


@task
def makezip():
    require('lambda_function')
    with lcd(os.path.join(BASE_PATH, env.lambda_function)):
        task_makezip = MakeZipTask(
            zip_file=os.path.join(BASE_PATH, env.lambda_function, 'lambda_function.zip'),
            exclude_file=os.path.join(BASE_PATH, env.lambda_function, 'exclude.lst'),
            lib_path=os.path.join(BASE_PATH, env.lambda_function, 'lib')
        )
        task_makezip.run()


@task
def aws_invoke():
    require('lambda_function')
    task_aws_invoke = AWSLambdaInvokeTask(
        function_name=env.lambda_function,
        payload='file://{}'.format(os.path.join(BASE_PATH, env.lambda_function, 'event.json'))
    )
    task_aws_invoke.run()


@task
def aws_config():
    require('lambda_function')
    task_aws_getconfig = AWSLambdaGetConfigTask(
        function_name=env.lambda_function
    )
    task_aws_getconfig.run()


@task
def aws_updatecode():
    require('lambda_function')
    task_aws_updatecode = AWSLambdaUpdateCodeTask(
        function_name=env.lambda_function,
        zip_file='fileb://{}'.format(os.path.join(BASE_PATH, env.lambda_function, 'lambda_function.zip'))
    )
    task_aws_updatecode.run()


@task
def make():
    require('lambda_function')
    makezip()
    aws_updatecode()
    aws_invoke()
