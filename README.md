# jumpNumbers

This calculates the sequence of polynomials mod p defined by

    a[n+k] = REDUCE(sum_{j=0}^{j=k-1} c[j]*a[n+j])

where the REDUCE operator subtracts multiples of the previous a[j]
to decrease the degree of the polynomial as much as possible.
If it reduces to the zero polynomial, then n+k is called a jump number
and is printed to the Jump textarea