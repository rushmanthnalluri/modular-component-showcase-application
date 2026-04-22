# FastAPI vs Flask vs Django DRF

## FastAPI (Gateway choice)
- native async support
- automatic OpenAPI generation
- strong validation with Pydantic
- better fit for proxy, aggregation, and policy middleware workloads

## Flask
- minimal and flexible
- requires more manual assembly for validation, schema generation, and async parity

## Django DRF
- rich batteries-included platform
- heavier than needed for a thin ingress gateway

## Comparison Table
| Framework | Strength | Weakness | Fit in this repo |
|---|---|---|---|
| FastAPI | async, schema-first, lightweight | smaller enterprise ORM/admin story | best gateway fit |
| Flask | simple and flexible | more manual integration work | viable but slower to harden |
| Django DRF | mature enterprise stack | heavier footprint | better for monolith/API platform than thin gateway |

## Decision Rationale
Gateway requirements are:
- async downstream forwarding
- contract visibility
- middleware composition
- dependency-injection style security and database access

FastAPI satisfies those needs with the least extra framework weight.
