let base=2
let counter=0
let debugging = false

class Debug {
 static log(x){
   if (debugging){
     console.log(x)
   }
 }
 static dir(x){
   if (debugging){
     console.dir(x)
   }
 }
}

class Poly{
  constructor(coeffs){
    this.coeffs = coeffs
  }

  toString(){
    let s=""
    for(let i=this.coeffs.length-1; i>=0; i--){
      const a = this.coeffs[i]
      if (a>1)
        s = s + " + "+a+"t^"+i+" "
      else if (a==1)
        s = s + " + t^"+i+" "
    }
    if (s.length==0) return "0"
    return s;
  }

  add(other){
    let result = []
    const a = this.coeffs
    const b = other.coeffs
    const n = Math.max(a.length,b.length)
    for(let i=0;i<n;i++){
      result[i] = ((a[i]||0)+(b[i]||0)) % base
    }
    return new Poly(this.trimZeroes(result))
  }

  trimZeroes(cs){
    let i=cs.length-1
    while(cs[i]==0 && i>0) i--;
    let list=[]
    for(let j=0; j<=i; j++)
      list[j]=cs[j]
    return list
  }

  scale(c){
    while(c<0) {
      c+= base
    }
    try {
    const p = new Poly(this.coeffs.map(function(x){return (x*c)%base}))
    //Debug.dir(['scale',this,c,p])
    return p
  } catch(e){
    Debug.dir(this)
    Debug.dir(c)
    alert("Error!" + e + " "+this.toString()+" "+c)
  }
  }

  mult(other){
    let result=[]
    const a = this.coeffs
    const b = other.coeffs
    const na =a.length
    const nb = b.length
    for(let i=0;i<na+nb-1; i++){
      let val=0;
      for(let j=0;j<=Math.min(na,i); j++){
        val = (val + ((a[j]||0)*(b[i-j]||0))%base ) %base
      }
      result[i]=val
    }
    return new Poly(result)
  }
}

/**
This class maintains a sequence of linearly independent polynomials mod p
in a normal form.
Each polynomial in the sequence has a unique highest order term.
When we get a new polynomial we repeatedly remove the highest order term
(if possible) by subtracting a multiple of the corresponding polynomial in the
basis. If we get to zero, then it is linearly dependent and we return the
0 polynomial, otherwise we add it to the basis.
In practice, we represent polynomials as arrays of modp coefficients and
so we store the basis in an array indexed by the highest order term...

This will be used to calculate the gap sequence ...
*/
class NormalSeq {

  constructor(){
    this.polys = []
    this.jumps=[]
  }

  addPoly(p,n) {
    Debug.log(`in addPoly: REDUCING p(${n}) = ${p.toString()}`)
    const q = this.reduce(p)

    Debug.dir(['addPoly',p,q,n])
    if (q.coeffs.length==1){
      if (p.coeffs.length > 1){
        this.jumps.push(n)
      }
    }else {
      this.polys[q.coeffs.length-1] = q
      Debug.log("ADDING POLY "+p.toString()+" "+q.toString())
      Debug.dir([p,q,this.polys])
    }
    return q
  }



  reduce(p){

    // this needs more work!!
    let result=null


    Debug.log(`REDUCE -- CALL ${p.toString()}`)
    Debug.dir(p)
    let k = p.coeffs.length
    Debug.log("There are "+this.polys.length+" polys:")
    for (let i=0; i<this.polys.length;i++){
      let z = this.polys[i]
      z = z || 'no-value'
      Debug.log(`polys[${i}] = ${z.toString()}`)
    }

    while (!result){
        let k1 = k
        k = p.coeffs.length-1
        Debug.log('top of while k='+k+' p='+p.toString())
        if (k1==k){
          result = p //return p.bigproblem
        }
        else if (k==0){
          Debug.log('case k=0 returning '+p.toString())
          result = p
        } else if (this.polys[k]) {


          Debug.log(`case 1: reduce(${p.toString()})`)
          const z = this.inverse(this.polys[k].coeffs[k])
          const q = this.polys[k].scale(z)
          Debug.log(`subtracting ${k} -- ${q.toString()}`)
          Debug.dir(p)
          Debug.dir(['zzz',k,this.polys,q,p.coeffs[k]])

          Debug.dir(q.scale(-p[k]).toString())
          const p1 = p.add(q.scale(-p.coeffs[k]))
          //Debug.dir(p1)
          //Debug.log(`returning '${p1.toString()}'`)
          p = p1 //this.reduce(p1)
          Debug.log(`subtracting ${z} * ${this.polys[k].toString()} to get ${p.toString()}`)
          Debug.log('*******')
        } else {
          Debug.log('case 2')

          const z = this.inverse(p.coeffs[k])

          this.polys[k] = p//.scale(z)
          Debug.dir(['zzzz',p,k,this.polys,this.polys[k],p.coeffs[k],z,p.scale(z)])
          Debug.log(`storing ${this.polys[k]}`)
          result =  this.polys[k]
        }
      }
    Debug.log(`REDUCE -- RETURNING ${result.toString()}`)
    Debug.log("There are "+this.polys.length+" polys:")
    for (let i=0; i<this.polys.length;i++){
      let z = this.polys[i]
      z = z || 'no-value'
      Debug.log(`polys[${i}] = ${z.toString()}`)
    }
    return result
  }

  inverse(s){
    if (base==2) return s
    if (base==3) return s
    for(let i=1; i<base; i++){
      if ((i*s)%base ==1)
        return(i);
    }
  }


}




class Recur{
  constructor(c,a){
    this.c=c
    this.a=a
    this.r=[];
    this.k = c.length
    this.n = this.k
    this.ns = new NormalSeq()
  }

  toString(){
    let s = "c("
    for(let i=0; i<this.c.length; i++){
      s+=this.c[i].toString()+", "
    }
    s+="), a("
    for(let i=0; i<this.a.length; i++){
      s+=this.a[i].toString()+", "
    }
    s+=")"
    s = "Rec("+s+")"
    return s
  }

  next(){
    Debug.log('in Next: this.n='+this.a.length)
    this.n=this.a.length
    let p = new Poly([0])
    Debug.log("this.k="+this.k+" this.n="+this.n)
    for(let i=0;i<this.k;i++){
      Debug.log(`i=${i} c[i]=${this.c[i]} a[${this.n-this.k+i}]=${this.a[this.n-this.k+i]}`)
      const prod = this.c[i].mult(this.a[this.n-this.k+i])
      Debug.log(`product = ${prod}`)
      p = p.add(prod)
      Debug.log(`p=${p} i=${i} this.k-1=${this.k-1}`)
    }
    this.a.push(p)
    return p
  }

  run(k){
    let output=""
    for(let i=0; i<k; i++){
      const thePoly = this.next()
      const theLine = `a(${this.a.length-1})=${thePoly.toString()}\n`
      output += theLine
      Debug.log(theLine)
      const q = r.ns.addPoly(thePoly,this.a.length-1)
      this.r.push(q)
      Debug.log(`r(${this.a.length-1}) = ${q.toString()}`)
    }
    //Debug.log('*****')
    //Debug.log(output)
    //Debug.log('*****')
    info.innerText += output
    jump.innerText = r.ns.jumps.toString()
  }

  runMore(){
    const num = JSON.parse(n.value)
    this.run(num)
    let output=""
    for (let i=0; i<this.a.length; i++){
      const p1 = this.a[i].toString();
      const p2 = this.r[i].toString();
      if (p1==p2)
        output += `a(${i})= ${this.a[i].toString()}\n`
      else
        output += `\na(${i})= ${this.a[i].toString()}\n  -> ${this.r[i]}\n\n`
    }
    info.innerText = output
  }
}


let r = null

function go(){
  const num = JSON.parse(n.value)
  base = JSON.parse(b.value)
  const coeffs = JSON.parse(cs.value).map(toPoly)
  const seq = JSON.parse(as.value).map(toPoly)
  r = new Recur(coeffs,seq)
  for(let i=0; i<seq.length; i++){
    const q = r.ns.addPoly(seq[i],i)
    r.r.push(q)
  }
  init.innerText = "coeffs:\n"
  for(let i=0; i<coeffs.length;i++){
    init.innerText += `c(${i})=${coeffs[i].toString()}\n`
  }
  init.innerText += "sequence\n"
  for(let i=0; i<coeffs.length;i++){
    init.innerText += `a(${i})=${seq[i].toString()}\n`
  }

//  r.run(num)
}

function toPoly(cs){
  return new Poly(cs)
}
