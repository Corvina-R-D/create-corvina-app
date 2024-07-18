
.PHONY: build
build: 
	go build -o build/main main.go

.PHONY: clean
clean: 
	rm -rf build

.PHONY: cross-build
cross-build:
	./cross-arch-compiler.sh