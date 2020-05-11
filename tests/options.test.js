const test = document.getElementById("test4")

function testUpdateDomainProductive() {
    console.log("Testing updateDomainProductive");
    if (test.innerHTML != updateDomainProductive("", true)) {
        test.innerHTML = "FAILED: didn't check for"
    }
    //updateDomainProductive("unproductive.com", false);
}
testUpdateDomainProductive();