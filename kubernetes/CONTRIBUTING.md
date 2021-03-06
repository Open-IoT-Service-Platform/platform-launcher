# Contributing to Open-IoT-Service-Platform - Kubernetes templates

The Open-IoT-Service-Platform is an opensource project and we are actively looking for people to help
with:

* Extending the functionality, API with useful functions
* Creation of documentation for the project
* Creation of new test cases
* Bug reports
* Anything you find useful :) Ideas always welcome!

The recommended method to contribute is to fork on github, and then send pull
requests to the main project. PRs should be made on the develop branch.
You can open issues if you find any bugs/have questions. If you want to work on a
large feature then we suggest you file an issue first so we can avoid
dissapointments come merging time!

If you'd rather not use github you are more than welcome to send git formatted
patches to our mailing list mraa@lists.01.org which you can register for access
on: https://lists.01.org/mailman/listinfo/oisp-dev

---
## Warning
The kubernetes integration is still WIP, please open an issue or contact
`arkocal@gmail.com` first if you want to contribute.
---

## Basic rules

* Your code must pass tests (run `make deploy-oisp-test && make test`)
* Commits must have a sign*off line by at least yourself
* Commits must be named <file/module>: Some decent description
* Base your changes on a develope branch.
* Try to split commits up logically, you will be asked to rebase them if they
  are not.
* Try to stick to the established coding style regardless of your personal
  feeling for it!

## Author Rules

If you create a file, then add yourself as the Author at the top. If you did a
large contribution to it (or if you want to ;-)), then fee free to add yourself
to the contributors list in that file. You can also add your own copyright
statement to the file but cannot add a license of your own. If you're borrowing
code that comes from a project with another license, make sure to explicitly
note this in your PR.

## Code signing

The sign-off is a simple line at the end of the explanation for the
patch, which certifies that you wrote it or otherwise have the right to pass it
on as an open-source patch.  The rules are pretty simple: if you can certify
the below:

Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

a. The contribution was created in whole or in part by me and I
   have the right to submit it under the open source license
   indicated in the file; or

b. The contribution is based upon previous work that, to the best
   of my knowledge, is covered under an appropriate open source
   license and I have the right under that license to submit that
   work with modifications, whether created in whole or in part
   by me, under the same open source license (unless I am
   permitted to submit under a different license), as indicated
   in the file; or

c. The contribution was provided directly to me by some other
   person who certified (a), (b) or (c) and I have not modified
   it.

d. I understand and agree that this project and the contribution
   are public and that a record of the contribution (including all
   personal information I submit with it, including my sign-off) is
   maintained indefinitely and may be redistributed consistent with
   this project or the open source license(s) involved.

then you just add a line saying

`Signed-off-by: Random P Developer <random@developer.example.org>`

Using your real name (sorry, no pseudonyms or anonymous contributions.)
