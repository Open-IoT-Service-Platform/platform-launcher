#!/usr/bin/env bats
load "lib/utils"
load "lib/linter"

@test "linting tests" {

	run lint "test-operators/operators-are-up-cassandra.bats"
	[ "$status" -eq 0 ]

	run lint "test-operators/operators-are-up-cert-manager.bats"
	[ "$status" -eq 0 ]

	run lint "test-operators/operators-are-up-minio.bats"
	[ "$status" -eq 0 ]
	
	run lint "linting.bats"
	[ "$status" -eq 0 ]

}