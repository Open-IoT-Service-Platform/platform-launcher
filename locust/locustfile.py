import time
import random
import re
from uuid import uuid4

from oisp import Client
from locust import HttpLocust, TaskSet, task

REGEX_UUID = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

class LocustOispClient(Client):

    def __init__(self, locust_client):
        # Set api root without full URL to use --host parameter
        # from Locust instead
        self.locust_client = locust_client
        Client.__init__(self, api_root="/v1/api")


    def _make_request(self, func, endpoint, authorize,
                      authorize_as, *args, **kwargs):
        name = re.sub(REGEX_UUID, "[uuid]", endpoint)
        return Client._make_request(self, func, endpoint, authorize,
                             authorize_as, name=name, *args, **kwargs)


    def get(self, endpoint, authorize=True, authorize_as=None,
            *args, **kwargs):
        """Make a GET request.

        Args:
        ----------
        endpoint: Endpoint without the API root.
        authorize: Whether authorization token should be included.
        Other arguments are passed to requests module.

        """
        return self._make_request(self.locust_client.get, endpoint, authorize,
                                  authorize_as, *args, **kwargs)

    def post(self, endpoint, authorize=True, authorize_as=None,
             *args, **kwargs):
        """Make a POST request.

        Args:
        ----------
        endpoint: Endpoint without the API root.
        authorize: Whether authorization token should be included.
        Other arguments are passed to requests module.

        """
        return self._make_request(self.locust_client.post, endpoint, authorize,
                                  authorize_as, *args, **kwargs)

    def put(self, endpoint, authorize=True, authorize_as=None,
            *args, **kwargs):
        """Make a PUT request.

        Args:
        ----------
        endpoint: Endpoint without the API root.
        authorize: Whether authorization token should be included.
        Other arguments are passed to requests module.

        """
        return self._make_request(self.locust_client.put, endpoint, authorize,
                                  authorize_as, *args, **kwargs)

    def delete(self, endpoint, authorize=True, authorize_as=None,
               *args, **kwargs):
        """Make a DELETE request.

        Args:
        ----------
        endpoint: Endpoint without the API root.
        authorize: Whether authorization token should be included.
        Other arguments are passed to requests module.

        """
        return self._make_request(self.locust_client.delete, endpoint, authorize,
                                  authorize_as, *args, **kwargs)



class MyTaskSet(TaskSet):
    def on_start(self):
        self.oisp_client = LocustOispClient(self.client)
        userid = random.randint(1,10)
        self.oisp_client.auth("user{}@example.com".format(userid), "password")
        self.account = self.oisp_client.create_account("account_{}".format(self.locust))
        time.sleep(1)
        self.oisp_client.auth("user{}@example.com".format(userid), "password")
        self.devices = [self.account.create_device("device_{}".format(uuid4()),
                                                   "device_{}".format(uuid4()))
                        for i in range(5)]
        for dev in self.devices:
            dev.activate()
            dev.singleton_cid = dev.add_component("temp", "temperature.v1.0")["cid"]

    @task(1)
    def get_health(self):
        self.oisp_client.get_server_info()

    @task(1)
    def getdevs(self):
        self.account.get_devices()

    @task(50)
    def data(self):
        dev = random.choice(self.devices)
        dev.add_sample(dev.singleton_cid, random.random()*10)
        dev.submit_data()


class MyLocust(HttpLocust):
    task_set = MyTaskSet
    min_wait = 0
    max_wait = 0
