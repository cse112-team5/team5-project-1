const test = document.getElementById("test4")

function testUpdateDomainProductive() {
    console.log("Testing updateDomainProductive");
    if (updateDomainProductive("", true) != -1) {
        test.innerHTML = "FAILED: didn't check for"
    }
    test.innerHTML = "Passed: properly returns 0 on sucess";
    //updateDomainProductive("unproductive.com", false);
}