#! /usr/bin/python3
"""Create a payload and apache benchmark command to run tests.

This assumes a user 'user1@example.com' with password 'password'
already exists.

Prints the filename suffix. runtest{suffix}.sh is the generated script.
The output is stored in perc{suffix}.txt and out{suffix}.txt
"""
import uuid

import argparse
import oisp

DASHBOARD_URL = "http://dashboard:4001"
USERNAME = "user1@example.com"
PASSWORD = "password"

DEFAULT_TIMEOUT = 120
DEFAULT_CONCURRENCY = 20
# Just set this to a very large number to actually run into timeout
DEFAULT_NR_REQUESTS = 640000

def create_test(concurrency=DEFAULT_CONCURRENCY,
                timeout = DEFAULT_TIMEOUT,
                filename_suffix=None):
    if filename_suffix is None:
        filename_suffix = ""
    else:
        filename_suffix = "_" + filename_suffix
    filename_suffix += "_c{}_t{}".format(concurrency, timeout)

    client = oisp.Client(DASHBOARD_URL + "/v1/api")
    client.auth(USERNAME, PASSWORD)

    account_name = str(uuid.uuid4())
    account = client.create_account(account_name)

    device_id = str(uuid.uuid4())
    gateway_id = device_id
    device = account.create_device(gateway_id, device_id)
    device.activate()

    component_name = str(uuid.uuid4())
    cid = device.add_component(component_name, "temperature.v1.0")["cid"]

    device.add_sample(cid, 10)
    device.submit_data()

    request = client.response.request

    script_filename = "runtest{}.sh".format(filename_suffix)
    payload_filename = "payload{}.json".format(filename_suffix)
    perc_filename = "perc{}.txt".format(filename_suffix)
    out_filename = "out{}.txt".format(filename_suffix)
    with open(payload_filename, "w") as payload_file:
        payload_file.write(request.body)
    with open(script_filename, "w") as test_script_file:
        test_script_file.write("""ab -l -p {} -T application/json -H "Authorization: {}" """
                               """ -n {} -t {} -e {} -c {} {} > {}""".format(payload_filename,
                                                            request.headers["Authorization"],
                                                            DEFAULT_NR_REQUESTS, timeout,
                                                            perc_filename, concurrency,
                                                            request.url, out_filename))
    return script_filename


if __name__=="__main__":
    parser = argparse.ArgumentParser(description='Create a simple load test script.')
    parser.add_argument("--suffix", metavar="suffix", default=None, help="Filename suffix")
    parser.add_argument("--concurrency", metavar="concurrency", type=int,
                        help="Passed to ab", default=DEFAULT_CONCURRENCY)
    args = parser.parse_args()
    print(create_test(filename_suffix=args.suffix, concurrency=args.concurrency))
