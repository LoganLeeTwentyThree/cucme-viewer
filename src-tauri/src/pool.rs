use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Pool {
    pub id : String,
    pub mac: String,
    pub dn: String,
    pub paging_dn : Option<String>,
}